import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, ContactStatus } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@Injectable()
export class ContactFollowUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
  async update(
    id: number,
    updateContactMessageDto: UpdateContactMessageDto,
    actorId?: number,
  ) {
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

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Mensajes',
        description: `Se actualizó el seguimiento de la solicitud de ${updatedMessage.name} (${updatedMessage.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          previousStatus: message.status,
          newStatus: updatedMessage.status,
          previousPriority: message.priority,
          newPriority: updatedMessage.priority,
          publicReplyUpdated: hasPublicReply,
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
  async markAsRead(id: number, actorId?: number) {
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

      await this.auditLogService.createLog({
        action: AuditLogAction.MARK_READ,
        module: 'Mensajes',
        description: `Se marcó como leída la solicitud de ${updatedMessage.name} (${updatedMessage.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          previousReadStatus: message.isRead,
          newReadStatus: updatedMessage.isRead,
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
  async remove(id: number, actorId?: number) {
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

      await this.auditLogService.createLog({
        action: AuditLogAction.DELETE,
        module: 'Mensajes',
        description: `Se eliminó la solicitud de ${deletedMessage.name} (${deletedMessage.email}).`,
        actorId,
        targetId: deletedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          projectType: deletedMessage.projectType,
          status: deletedMessage.status,
          priority: deletedMessage.priority,
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
