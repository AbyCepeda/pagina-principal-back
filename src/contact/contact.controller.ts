import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Ruta pública.
   *
   * Cualquier visitante de la landing puede enviar un mensaje.
   */
  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  /**
   * Ruta privada.
   *
   * Solo usuarios ADMIN pueden listar mensajes.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  /**
   * Ruta privada.
   *
   * Solo ADMIN puede consultar cuántos mensajes no leídos hay.
   *
   * Importante:
   * Esta ruta debe ir ANTES de @Get(':id')
   * para que Nest no interprete "unread" como si fuera un id.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('unread/count')
  countUnread() {
    return this.contactService.countUnread();
  }

  /**
   * Ruta privada.
   *
   * Solo ADMIN puede consultar un mensaje específico.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(Number(id));
  }

  /**
   * Ruta privada.
   *
   * Solo ADMIN puede marcar mensajes como leídos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(Number(id));
  }

  /**
   * Ruta privada.
   *
   * Solo ADMIN puede eliminar mensajes.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactService.remove(Number(id));
  }
}