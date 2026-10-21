import {
  ApiTags,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
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
import type { CurrentUser as CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';
import { AssignAdminProfileDto } from '../admin-profiles/dto/assign-admin-profile.dto';

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crea usuarios desde el panel ADMIN.
   *
   * Esta ruta sí permite elegir USER o ADMIN porque está protegida.
   */
  @ApiEndpoint({
    summary: 'Crear un usuario activo',
    access: 'admin',
    status: 201,
  })
  @ApiConflictResponse({ description: 'El correo ya está registrado.' })
  @Post()
  @RequirePermissions('users:create')
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const user = await this.usersService.create(createUserDto, currentUser);

    return {
      success: true,
      message: 'Usuario creado correctamente.',
      data: user,
    };
  }

  /**
   * Lista usuarios del sistema con paginación, búsqueda y filtros.
   */
  @ApiEndpoint({
    summary: 'Listar y filtrar usuarios',
    access: 'admin',
    status: 200,
  })
  @Get()
  @RequirePermissions('users:read')
  findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Cambia el rol de un usuario.
   */
  @ApiEndpoint({
    summary: 'Cambiar el rol de un usuario',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id/role')
  @RequirePermissions('users:assign-profile')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.updateRole(
      Number(id),
      updateUserRoleDto.role,
      currentUser,
    );
  }

  @ApiEndpoint({
    summary: 'Asignar un perfil administrativo a un usuario',
    access: 'admin',
    status: 200,
  })
  @Patch(':id/profile')
  @RequirePermissions('users:assign-profile')
  assignProfile(
    @Param('id') id: string,
    @Body() dto: AssignAdminProfileDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.assignAdminProfile(
      Number(id),
      dto.adminProfileId,
      currentUser,
    );
  }

  /**
   * Activa o desactiva un usuario.
   */
  @ApiEndpoint({
    summary: 'Activar o desactivar un usuario',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id/status')
  @RequirePermissions('users:update')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.updateStatus(
      Number(id),
      updateUserStatusDto.isActive,
      currentUser.id,
    );
  }

  /**
   * Elimina un usuario.
   */
  @ApiEndpoint({ summary: 'Eliminar un usuario', access: 'admin', status: 200 })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  @RequirePermissions('users:delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.remove(Number(id), currentUser.id);
  }
}
