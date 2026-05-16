import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
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
  }

  async findAll() {
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
  }

  async findOne(id: number) {
    const contactMessage = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
    });

    if (!contactMessage) {
      return {
        success: false,
        message: 'Mensaje de contacto no encontrado',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Mensaje obtenido correctamente',
      data: contactMessage,
    };
  }

  async remove(id: number) {
    const contactMessage = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
    });

    if (!contactMessage) {
      return {
        success: false,
        message: 'Mensaje de contacto no encontrado',
        data: null,
      };
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
  }

  async markAsRead(id: number) {
    const contactMessage = await this.prisma.contactMessage.findUnique({
      where: {
        id,
      },
    });

    if (!contactMessage) {
      return {
        success: false,
        message: 'Mensaje de contacto no encontrado',
        data: null,
      };
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
  }
}
