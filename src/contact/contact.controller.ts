import { ContactCommentsService } from './contact-comments.service';
import { ContactAnalysisService } from './contact-analysis.service';
import { ContactFollowUpService } from './contact-follow-up.service';
import { ApiTags, ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
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
import { getQuoteCatalog } from './quote-estimator';
import { CreateContactCommentDto } from './dto/create-contact-comment.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

import type { CurrentUser as CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Solicitudes y comentarios')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly commentsService: ContactCommentsService,
    private readonly analysisService: ContactAnalysisService,
    private readonly followUpService: ContactFollowUpService,
  ) {}

  @ApiEndpoint({ summary: 'Consultar las tarifas y extras del cotizador' })
  @Get('quote-catalog')
  quoteCatalog() {
    return { success: true, data: getQuoteCatalog() };
  }

  /**
   * Ruta pública.
   *
   * Guarda una solicitud enviada desde la landing.
   */
  @ApiEndpoint({
    summary: 'Enviar una solicitud de cotización',
    access: 'public',
    status: 201,
  })
  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  /**
   * Ruta privada.
   *
   * Permite que un usuario autenticado vea sus propias solicitudes.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Consultar mis solicitudes',
    access: 'authenticated',
    status: 200,
  })
  @Get('my-messages')
  findMyMessages(@CurrentUser() user: CurrentUserPayload) {
    return this.contactService.findMyMessages(user.id);
  }

  /**
   * Ruta privada.
   *
   * Devuelve cuántos comentarios nuevos tiene el usuario autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Contar comentarios nuevos para el usuario',
    access: 'authenticated',
    status: 200,
  })
  @Get('comments/unread-count')
  countUnreadComments(@CurrentUser() user: CurrentUserPayload) {
    return this.commentsService.countUnreadComments(user);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Cuenta mensajes no leídos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Contar solicitudes sin leer',
    access: 'admin',
    status: 200,
  })
  @Get('unread-count')
  countUnread() {
    return this.followUpService.countUnread();
  }

  /**
   * Ruta privada ADMIN.
   *
   * Lista mensajes con paginación, búsqueda y filtros.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Listar y filtrar solicitudes',
    access: 'admin',
    status: 200,
  })
  @Get()
  findAll(@Query() query: GetContactMessagesQueryDto) {
    return this.contactService.findAll(query);
  }

  /**
   * Ruta privada.
   *
   * Obtiene los comentarios de una solicitud.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Consultar comentarios de una solicitud accesible',
    access: 'authenticated',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id/comments')
  findComments(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.findComments(Number(id), user);
  }

  /**
   * Ruta privada.
   *
   * Agrega un comentario a una solicitud.
   */
  @UseGuards(JwtAuthGuard)
  @ApiEndpoint({
    summary: 'Comentar una solicitud accesible',
    access: 'authenticated',
    status: 201,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() createContactCommentDto: CreateContactCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.commentsService.createComment(
      Number(id),
      createContactCommentDto,
      user,
    );
  }

  /**
   * Ruta privada ADMIN.
   *
   * Genera un análisis técnico automático de la solicitud.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Generar el análisis técnico de una solicitud',
    access: 'admin',
    status: 201,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Post(':id/technical-analysis')
  generateTechnicalAnalysis(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.analysisService.generateTechnicalAnalysis(Number(id), user.id);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Obtiene un mensaje por ID.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Consultar una solicitud',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followUpService.findOne(Number(id));
  }

  /**
   * Ruta privada ADMIN.
   *
   * Actualiza seguimiento, estado, prioridad, notas internas
   * y respuesta visible para el usuario.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Actualizar el seguimiento de una solicitud',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactMessageDto: UpdateContactMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.followUpService.update(
      Number(id),
      updateContactMessageDto,
      user.id,
    );
  }

  /**
   * Ruta privada ADMIN.
   *
   * Marca un mensaje como leído.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Marcar una solicitud como leída',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.followUpService.markAsRead(Number(id), user.id);
  }

  /**
   * Ruta privada ADMIN.
   *
   * Elimina un mensaje.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Eliminar una solicitud',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.followUpService.remove(Number(id), user.id);
  }
}
