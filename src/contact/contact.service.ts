import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  create(createContactDto: CreateContactDto) {
    return {
      success: true,
      message: 'Mensaje recibido correctamente',
      data: {
        ...createContactDto,
        createdAt: new Date().toISOString(),
      },
    };
  }
}