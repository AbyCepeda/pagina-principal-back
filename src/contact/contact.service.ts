import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    try {
      const contactMessage = await this.prisma.contactMessage.create({
        data: {
          name: createContactDto.name,
          projectType: createContactDto.projectType,
          budget: createContactDto.budget,
          message: createContactDto.message,
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

  async findAll() {
    try {
      const contactMessages = await this.prisma.contactMessage.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Mensajes obtenidos correctamente',
        data: contactMessages,
      };
    } catch (error) {
      console.error('Error al obtener mensajes de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los mensajes de contacto.',
      );
    }
  }

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