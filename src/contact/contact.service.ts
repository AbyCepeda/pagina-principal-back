import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda un mensaje enviado desde la landing pública.
   */
  async create(createContactDto: CreateContactDto) {
    try {
      const contactMessage = await this.prisma.contactMessage.create({
        data: {
          name: createContactDto.name.trim(),
          email: createContactDto.email.trim().toLowerCase(),
          projectType: createContactDto.projectType.trim(),
          budget: createContactDto.budget.trim(),
          message: createContactDto.message.trim(),
        },
      });

      return {
        success: true,
        message: 'Mensaje guardado correctamente',
        data: contactMessage,
      };
    } catch (error) {
      console.error('Error al guardar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo guardar el mensaje de contacto.',
      );
    }
  }

  /**
   * Lista mensajes de contacto con búsqueda, filtro y paginación.
   *
   * Permite:
   * - Buscar por nombre, correo, tipo de proyecto, presupuesto o mensaje.
   * - Filtrar por leído/no leído.
   * - Paginar resultados.
   */
  async findAll(query: GetContactMessagesQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const search = query.search?.trim();

      const where: Prisma.ContactMessageWhereInput = {
        ...(typeof query.isRead === 'boolean'
          ? {
              isRead: query.isRead,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                  },
                },
                {
                  email: {
                    contains: search,
                  },
                },
                {
                  projectType: {
                    contains: search,
                  },
                },
                {
                  budget: {
                    contains: search,
                  },
                },
                {
                  message: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
      };

      const [contactMessages, total] = await this.prisma.$transaction([
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
        message: 'Mensajes obtenidos correctamente',
        data: contactMessages,
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
   * Cuenta los mensajes no leídos.
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
        message: 'Total de mensajes no leídos obtenido correctamente',
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('Error al contar mensajes no leídos:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el total de mensajes no leídos.',
      );
    }
  }

  /**
   * Busca un mensaje por id.
   */
  async findOne(id: number) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!contactMessage) {
        throw new NotFoundException('Mensaje de contacto no encontrado.');
      }

      return {
        success: true,
        message: 'Mensaje obtenido correctamente',
        data: contactMessage,
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
   * Marca un mensaje como leído.
   */
  async markAsRead(id: number) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!contactMessage) {
        throw new NotFoundException('Mensaje de contacto no encontrado.');
      }

      const updatedContactMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

      return {
        success: true,
        message: 'Mensaje marcado como leído correctamente',
        data: updatedContactMessage,
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
   * Elimina un mensaje de contacto.
   */
  async remove(id: number) {
    try {
      const contactMessage = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!contactMessage) {
        throw new NotFoundException('Mensaje de contacto no encontrado.');
      }

      await this.prisma.contactMessage.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: 'Mensaje eliminado correctamente',
        data: contactMessage,
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