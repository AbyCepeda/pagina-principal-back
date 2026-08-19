import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

type CurrentUserPayload = {
  id: number;
  email: string;
  role: Role;
};

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Ruta pública.
   *
   * Guarda una solicitud enviada desde la landing.
   */
  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  /**
   * Ruta privada.
   *
   * Permite que un usuario autenticado vea sus propias solicitudes.
   * Se buscan por el correo del usuario autenticado.
   *
   * Importante:
   * Esta ruta debe ir antes de @Get(':id') para que Nest no interprete
   * "my-messages" como si fuera un ID.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-messages')
  findMyMessages(@CurrentUser() user: CurrentUserPayload) {
    return this.contactService.findMyMessages(user.id);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Cuenta mensajes no leídos.
   *
   * Importante:
   * También debe ir antes de @Get(':id').
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('unread-count')
  countUnread() {
    return this.contactService.countUnread();
  }

  /**
   * Ruta privada ADMIN.
   *
   * Lista mensajes con paginación, búsqueda y filtros.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: GetContactMessagesQueryDto) {
    return this.contactService.findAll(query);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Obtiene un mensaje por ID.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(Number(id));
  }

  /**
   * Ruta privada ADMIN.
   *
   * Actualiza seguimiento, estado, prioridad, notas internas
   * y respuesta visible para el usuario.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactMessageDto: UpdateContactMessageDto,
  ) {
    return this.contactService.update(Number(id), updateContactMessageDto);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Marca un mensaje como leído.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(Number(id));
  }

  /**
   * Ruta privada ADMIN.
   *
   * Elimina un mensaje.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactService.remove(Number(id));
  }
}