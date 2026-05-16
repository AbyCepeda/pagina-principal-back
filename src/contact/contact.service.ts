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
}