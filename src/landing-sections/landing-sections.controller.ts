import { ApiTags, ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { LandingSectionsService } from './landing-sections.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Secciones de landing')
@Controller('landing-sections')
export class LandingSectionsController {
  constructor(
    private readonly landingSectionsService: LandingSectionsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('landing-sections:read')
  @ApiEndpoint({
    summary: 'Listar las secciones de la landing',
    access: 'admin',
    status: 200,
  })
  @Get()
  findAll() {
    return this.landingSectionsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('landing-sections:update')
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
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.landingSectionsService.update(
      key,
      updateLandingSectionDto,
      user.id,
    );
  }
}
