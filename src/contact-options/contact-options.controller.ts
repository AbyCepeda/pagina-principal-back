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

@Controller('contact-options')
export class ContactOptionsController {
  constructor(private readonly contactOptionsService: ContactOptionsService) {}

  /**
   * Ruta pública para llenar los selects de la landing.
   */
  @Get('public')
  findPublic(@Query() query: GetContactOptionsQueryDto) {
    return this.contactOptionsService.findPublic(query);
  }

  /**
   * Lista opciones para admin.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: GetContactOptionsQueryDto) {
    return this.contactOptionsService.findAll(query);
  }

  /**
   * Consulta detalle de una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactOptionsService.findOne(Number(id));
  }

  /**
   * Crea una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createContactOptionDto: CreateContactOptionDto) {
    return this.contactOptionsService.create(createContactOptionDto);
  }

  /**
   * Actualiza una opción.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactOptionsService.remove(Number(id));
  }
}