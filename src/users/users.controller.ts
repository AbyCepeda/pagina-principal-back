import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lista todos los usuarios.
   *
   * Solo ADMIN puede acceder porque el controller completo
   * está protegido con JwtAuthGuard, RolesGuard y @Roles(Role.ADMIN).
   */
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Actualiza el rol de un usuario.
   *
   * Ejemplo:
   * PATCH /users/2/role
   */
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.usersService.updateRole(
      Number(id),
      updateUserRoleDto.role,
      currentUser.id,
    );
  }

  /**
   * Activa o desactiva un usuario.
   *
   * Ejemplo:
   * PATCH /users/2/status
   *
   * Body:
   * {
   *   "isActive": false
   * }
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    return this.usersService.updateStatus(
      Number(id),
      updateUserStatusDto.isActive,
      currentUser.id,
    );
  }

  /**
   * Elimina un usuario.
   *
   * Nota: lo ideal en sistemas reales es desactivar,
   * pero dejamos delete como acción administrativa fuerte.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserType) {
    return this.usersService.remove(Number(id), currentUser.id);
  }
}