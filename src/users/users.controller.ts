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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

type CurrentUserPayload = {
  id: number;
  email: string;
  role: Role;
};

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const user = await this.usersService.create(createUserDto, currentUser.id);

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
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.updateRole(
      Number(id),
      updateUserRoleDto.role,
      currentUser.id,
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
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.remove(Number(id), currentUser.id);
  }
}
