import { ApiTags, ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { LandingSectionsService } from './landing-sections.service';

@ApiTags('Secciones de landing')
@Controller('landing-sections')
export class LandingSectionsController {
  constructor(
    private readonly landingSectionsService: LandingSectionsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Listar las secciones de la landing',
    access: 'admin',
    status: 200,
  })
  @Get()
  findAll() {
    return this.landingSectionsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Actualizar una sección de la landing',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() updateLandingSectionDto: UpdateLandingSectionDto,
  ) {
    return this.landingSectionsService.update(key, updateLandingSectionDto);
  }
}
