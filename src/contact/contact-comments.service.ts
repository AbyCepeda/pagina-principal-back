import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, Prisma, Role } from '@prisma/client';
import type { CurrentUser as CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateContactCommentDto } from './dto/create-contact-comment.dto';

@Injectable()
export class ContactCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Verifica que el usuario autenticado pueda acceder a una solicitud.
   *
   * ADMIN puede acceder a cualquier solicitud.
   * USER solo puede acceder si el correo de la solicitud coincide con su correo.
   */
  private async validateMessageAccess(
    contactMessageId: number,
    user: CurrentUserPayload,
  ) {
    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id: contactMessageId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (user.role === Role.ADMIN) {
      return message;
    }

    const messageEmail = message.email.trim().toLowerCase();
    const userEmail = user.email.trim().toLowerCase();

    if (messageEmail !== userEmail) {
      throw new ForbiddenException(
        'No tienes permisos para ver esta solicitud.',
      );
    }

    return message;
  }

  /**
   * Devuelve el rol contrario.
   *
   * Si quien abre es ADMIN, los mensajes pendientes son los del USER.
   * Si quien abre es USER, los mensajes pendientes son los del ADMIN.
   */
  private getOppositeRole(role: Role) {
    return role === Role.ADMIN ? Role.USER : Role.ADMIN;
  }

  /**
   * Cuenta comentarios no leídos para el usuario autenticado.
   *
   * ADMIN:
   * Cuenta todos los comentarios enviados por USER que no tengan readAt.
   *
   * USER:
   * Cuenta comentarios enviados por ADMIN que no tengan readAt
   * y que pertenezcan a solicitudes de su mismo correo.
   */
  async countUnreadComments(user: CurrentUserPayload) {
    try {
      const oppositeRole = this.getOppositeRole(user.role);

      const where: Prisma.ContactMessageCommentWhereInput = {
        readAt: null,
        senderRole: oppositeRole,

        ...(user.role === Role.USER
          ? {
              contactMessage: {
                email: user.email.trim().toLowerCase(),
              },
            }
          : {}),
      };

      const count = await this.prisma.contactMessageComment.count({
        where,
      });

      return {
        success: true,
        message: 'Comentarios no leídos obtenidos correctamente.',
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('Error al contar comentarios no leídos:', error);

      throw new InternalServerErrorException(
        'No se pudieron contar los comentarios no leídos.',
      );
    }
  }

  /**
   * Obtiene los comentarios de una solicitud.
   *
   * Al abrir la conversación, marca como leídos los comentarios del otro rol.
   */
  async findComments(contactMessageId: number, user: CurrentUserPayload) {
    try {
      await this.validateMessageAccess(contactMessageId, user);

      const oppositeRole = this.getOppositeRole(user.role);

      if (user.role === Role.ADMIN) {
        await this.prisma.contactMessage.updateMany({
          where: {
            id: contactMessageId,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
      }

      await this.prisma.contactMessageComment.updateMany({
        where: {
          contactMessageId,
          senderRole: oppositeRole,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      const comments = await this.prisma.contactMessageComment.findMany({
        where: {
          contactMessageId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        success: true,
        message: 'Comentarios obtenidos correctamente.',
        data: comments,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('Error al obtener comentarios:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los comentarios.',
      );
    }
  }

  /**
   * Crea un comentario dentro de una solicitud.
   */
  async createComment(
    contactMessageId: number,
    createContactCommentDto: CreateContactCommentDto,
    user: CurrentUserPayload,
  ) {
    try {
      await this.validateMessageAccess(contactMessageId, user);

      const author = await this.prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });

      if (!author) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const comment = await this.prisma.contactMessageComment.create({
        data: {
          contactMessageId,
          senderId: user.id,
          senderName: author.name,
          senderEmail: author.email.trim().toLowerCase(),
          senderRole: author.role,
          message: createContactCommentDto.message.trim(),
          readAt: null,
        },
      });

      if (author.role === Role.ADMIN) {
        await this.auditLogService.createLog({
          action: AuditLogAction.UPDATE,
          module: 'Mensajes',
          description: 'Un administrador respondió en una conversación.',
          actorId: user.id,
          actorName: author.name,
          actorEmail: author.email,
          actorRole: author.role,
          targetId: contactMessageId,
          targetType: 'ContactMessage',
          metadata: { commentId: comment.id },
        });
      }

      /**
       * Si el usuario responde, marcamos la solicitud como no leída
       * para que el admin la vuelva a revisar.
       */
      if (author.role === Role.USER) {
        await this.prisma.contactMessage.update({
          where: {
            id: contactMessageId,
          },
          data: {
            isRead: false,
          },
        });
      }

      return {
        success: true,
        message: 'Comentario enviado correctamente.',
        data: comment,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('Error al crear comentario:', error);

      throw new InternalServerErrorException(
        'No se pudo enviar el comentario.',
      );
    }
  }
}
