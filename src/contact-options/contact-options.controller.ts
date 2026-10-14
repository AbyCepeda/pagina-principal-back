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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ContactOptionsService } from './contact-options.service';
import { GetContactOptionsQueryDto } from './dto/get-contact-options-query.dto';
import { UpdateContactOptionDto } from './dto/update-contact-option.dto';
import { CreateContactOptionDto } from './dto/create-contact-option.dto';

@ApiTags('Opciones de contacto')
@Controller('contact-options')
export class ContactOptionsController {
  constructor(private readonly contactOptionsService: ContactOptionsService) {}

  /**
   * Ruta pública para llenar los selects de la landing.
   */
  @ApiEndpoint({
    summary: 'Consultar opciones de contacto activos',
    access: 'public',
    status: 200,
  })
  @Get('public')
  findPublic(@Query() query: GetContactOptionsQueryDto) {
    return this.contactOptionsService.findPublic(query);
  }

  /**
   * Lista opciones para admin.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Listar opciones de contacto',
    access: 'admin',
    status: 200,
  })
  @Get()
  findAll(@Query() query: GetContactOptionsQueryDto) {
    return this.contactOptionsService.findAll(query);
  }

  /**
   * Consulta detalle de una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Consultar un registro de opciones de contacto',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactOptionsService.findOne(Number(id));
  }

  /**
   * Crea una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Crear un registro de opciones de contacto',
    access: 'admin',
    status: 201,
  })
  @Post()
  create(@Body() createContactOptionDto: CreateContactOptionDto) {
    return this.contactOptionsService.create(createContactOptionDto);
  }

  /**
   * Actualiza una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Actualizar un registro de opciones de contacto',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactOptionDto: UpdateContactOptionDto,
  ) {
    return this.contactOptionsService.update(
      Number(id),
      updateContactOptionDto,
    );
  }

  /**
   * Elimina una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Eliminar un registro de opciones de contacto',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactOptionsService.remove(Number(id));
  }
}
