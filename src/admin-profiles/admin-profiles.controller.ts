import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequireAnyPermissions, RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SaveAdminProfileDto } from './dto/save-admin-profile.dto';
import { AdminProfilesService } from './admin-profiles.service';

@ApiTags('Perfiles administrativos')
@Controller('admin-profiles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@RequirePermissions('profiles:manage')
export class AdminProfilesController {
  constructor(private readonly profilesService: AdminProfilesService) {}

  @ApiEndpoint({
    summary: 'Listar perfiles y permisos disponibles',
    access: 'admin',
    status: 200,
  })
  @Get()
  @RequirePermissions()
  @RequireAnyPermissions('profiles:manage', 'users:assign-profile')
  findAll() {
    return this.profilesService.findAll();
  }

  @ApiEndpoint({
    summary: 'Crear un perfil administrativo',
    access: 'admin',
    status: 201,
  })
  @Post()
  create(
    @Body() dto: SaveAdminProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.profilesService.create(dto, user);
  }

  @ApiEndpoint({
    summary: 'Actualizar un perfil y sus permisos',
    access: 'admin',
    status: 200,
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveAdminProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.profilesService.update(id, dto, user);
  }

  @ApiEndpoint({
    summary: 'Eliminar un perfil sin usuarios asignados',
    access: 'admin',
    status: 200,
  })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.profilesService.remove(id, user);
  }
}
