import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ContactStatus, Prisma, Role } from '@prisma/client';
import { LeadAgentService } from '../lead-agent/lead-agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactCommentDto } from './dto/create-contact-comment.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

type CurrentUserPayload = {
  id: number;
  email: string;
  role: Role;
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadAgentService: LeadAgentService,
  ) {}

  /**
   * Crea una solicitud de contacto desde la landing.
   *
   * Antes de guardar valida cuántas solicitudes activas tiene el correo.
   * Si el usuario existe, usa su límite personalizado.
   * Si no existe, aplica límite base de 3.
   */
  async create(createContactDto: CreateContactDto) {
    try {
      const normalizedContact = {
        name: createContactDto.name.trim(),
        email: createContactDto.email.trim().toLowerCase(),
        projectType: createContactDto.projectType.trim(),
        budget: createContactDto.budget.trim(),
        message: createContactDto.message.trim(),
      };

      await this.validateActiveRequestLimit(normalizedContact.email);

      const analysis = this.leadAgentService.analyzeLead(normalizedContact);

      const contactMessage = await this.prisma.contactMessage.create({
        data: {
          ...normalizedContact,

          status: analysis.status,
          priority: analysis.priority,

          agentSummary: analysis.summary,
          agentSuggestedAction: analysis.suggestedAction,
          agentSuggestedReply: analysis.suggestedReply,
          agentScore: analysis.score,
          agentTags: analysis.tags,

          ...(typeof createContactDto.quotePlanSlug === 'string'
            ? { quotePlanSlug: createContactDto.quotePlanSlug.trim() }
            : {}),

          ...(typeof createContactDto.quotePlanName === 'string'
            ? { quotePlanName: createContactDto.quotePlanName.trim() }
            : {}),

          ...(typeof createContactDto.quoteMinPrice === 'number'
            ? { quoteMinPrice: createContactDto.quoteMinPrice }
            : {}),

          ...(typeof createContactDto.quoteMaxPrice === 'number'
            ? { quoteMaxPrice: createContactDto.quoteMaxPrice }
            : {}),

          ...(typeof createContactDto.quoteSuggestedBudget === 'string'
            ? {
                quoteSuggestedBudget:
                  createContactDto.quoteSuggestedBudget.trim(),
              }
            : {}),

          ...(typeof createContactDto.quoteComplexity === 'string'
            ? { quoteComplexity: createContactDto.quoteComplexity.trim() }
            : {}),

          ...(typeof createContactDto.quoteEstimatedTime === 'string'
            ? {
                quoteEstimatedTime:
                  createContactDto.quoteEstimatedTime.trim(),
              }
            : {}),

          ...(Array.isArray(createContactDto.quoteExtras)
            ? {
                quoteExtras:
                  createContactDto.quoteExtras as Prisma.InputJsonValue,
              }
            : {}),

          ...(createContactDto.quoteSnapshot
            ? {
                quoteSnapshot:
                  createContactDto.quoteSnapshot as Prisma.InputJsonValue,
              }
            : {}),
        },
      });

      return {
        success: true,
        message: 'Mensaje guardado correctamente.',
        data: contactMessage,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error al guardar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo guardar el mensaje de contacto.',
      );
    }
  }

  /**
   * Valida el límite de solicitudes activas por correo.
   *
   * Activas:
   * - NEW
   * - REVIEWING
   * - CONTACTED
   *
   * CLOSED no cuenta contra el límite.
   */
  private async validateActiveRequestLimit(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        projectRequestLimit: true,
      },
    });

    const requestLimit = user?.projectRequestLimit ?? 3;

    const activeRequestsCount = await this.prisma.contactMessage.count({
      where: {
        email: normalizedEmail,
        status: {
          in: [
            ContactStatus.NEW,
            ContactStatus.REVIEWING,
            ContactStatus.CONTACTED,
          ],
        },
      },
    });

    if (activeRequestsCount >= requestLimit) {
      throw new BadRequestException(
        `Este correo ya tiene ${activeRequestsCount} solicitudes activas. El límite actual es de ${requestLimit}. Espera a que una solicitud sea cerrada o contacta al administrador.`,
      );
    }
  }

  /**
   * Lista mensajes para ADMIN con búsqueda, filtros y paginación.
   */
  async findAll(query: GetContactMessagesQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const search = query.search?.trim();

      const where: Prisma.ContactMessageWhereInput = {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  projectType: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  budget: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  message: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  adminNotes: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  adminPublicReply: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  quotePlanName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),

        ...(typeof query.isRead === 'boolean'
          ? {
              isRead: query.isRead,
            }
          : {}),

        ...(query.status
          ? {
              status: query.status,
            }
          : {}),

        ...(query.priority
          ? {
              priority: query.priority,
            }
          : {}),
      };

      const [messages, total] = await this.prisma.$transaction([
        this.prisma.contactMessage.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.contactMessage.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Mensajes obtenidos correctamente.',
        data: messages,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error al obtener mensajes de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los mensajes de contacto.',
      );
    }
  }

  /**
   * Permite que el usuario autenticado vea sus propias solicitudes.
   *
   * De momento se relacionan por correo.
   */
  async findMyMessages(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          email: true,
          projectRequestLimit: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const normalizedEmail = user.email.trim().toLowerCase();

      const [messages, activeRequestsCount] = await this.prisma.$transaction([
        this.prisma.contactMessage.findMany({
          where: {
            email: normalizedEmail,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            email: true,
            projectType: true,
            budget: true,
            message: true,
            isRead: true,
            status: true,
            priority: true,
            contactedAt: true,

            adminPublicReply: true,
            adminReplyAt: true,

            quotePlanSlug: true,
            quotePlanName: true,
            quoteMinPrice: true,
            quoteMaxPrice: true,
            quoteSuggestedBudget: true,
            quoteComplexity: true,
            quoteEstimatedTime: true,
            quoteExtras: true,
            quoteSnapshot: true,

            createdAt: true,
            updatedAt: true,
          },
        }),

        this.prisma.contactMessage.count({
          where: {
            email: normalizedEmail,
            status: {
              in: [
                ContactStatus.NEW,
                ContactStatus.REVIEWING,
                ContactStatus.CONTACTED,
              ],
            },
          },
        }),
      ]);

      return {
        success: true,
        message: 'Solicitudes obtenidas correctamente.',
        data: messages,
        meta: {
          activeRequestsCount,
          requestLimit: user.projectRequestLimit,
          remainingRequests: Math.max(
            user.projectRequestLimit - activeRequestsCount,
            0,
          ),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener solicitudes del usuario:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener tus solicitudes.',
      );
    }
  }

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
   * Obtiene los comentarios de una solicitud.
   */
  async findComments(contactMessageId: number, user: CurrentUserPayload) {
    try {
      await this.validateMessageAccess(contactMessageId, user);

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
        },
      });

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

  /**
   * Obtiene un mensaje por ID para ADMIN.
   */
  async findOne(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      return {
        success: true,
        message: 'Mensaje obtenido correctamente.',
        data: message,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el mensaje de contacto.',
      );
    }
  }

  /**
   * Actualiza seguimiento del mensaje para ADMIN.
   *
   * - status
   * - priority
   * - adminNotes: solo admin
   * - adminPublicReply: visible para usuario
   */
  async update(id: number, updateContactMessageDto: UpdateContactMessageDto) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const hasPublicReply =
        typeof updateContactMessageDto.adminPublicReply === 'string';

      const trimmedPublicReply = hasPublicReply
        ? updateContactMessageDto.adminPublicReply?.trim()
        : undefined;

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          ...(updateContactMessageDto.status
            ? {
                status: updateContactMessageDto.status,
                contactedAt:
                  updateContactMessageDto.status === ContactStatus.CONTACTED
                    ? new Date()
                    : message.contactedAt,
              }
            : {}),

          ...(updateContactMessageDto.priority
            ? {
                priority: updateContactMessageDto.priority,
              }
            : {}),

          ...(typeof updateContactMessageDto.adminNotes === 'string'
            ? {
                adminNotes: updateContactMessageDto.adminNotes.trim() || null,
              }
            : {}),

          ...(hasPublicReply
            ? {
                adminPublicReply: trimmedPublicReply || null,
                adminReplyAt: trimmedPublicReply ? new Date() : null,
              }
            : {}),
        },
      });

      return {
        success: true,
        message: 'Mensaje actualizado correctamente.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al actualizar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el mensaje de contacto.',
      );
    }
  }

  /**
   * Marca un mensaje como leído.
   */
  async markAsRead(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

      return {
        success: true,
        message: 'Mensaje marcado como leído.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al marcar mensaje como leído:', error);

      throw new InternalServerErrorException(
        'No se pudo marcar el mensaje como leído.',
      );
    }
  }

  /**
   * Cuenta mensajes no leídos para ADMIN.
   */
  async countUnread() {
    try {
      const count = await this.prisma.contactMessage.count({
        where: {
          isRead: false,
        },
      });

      return {
        success: true,
        message: 'Mensajes no leídos obtenidos correctamente.',
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('Error al contar mensajes no leídos:', error);

      throw new InternalServerErrorException(
        'No se pudieron contar los mensajes no leídos.',
      );
    }
  }

  /**
   * Elimina un mensaje.
   */
  async remove(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const deletedMessage = await this.prisma.contactMessage.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: 'Mensaje eliminado correctamente.',
        data: deletedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al eliminar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar el mensaje de contacto.',
      );
    }
  }
}