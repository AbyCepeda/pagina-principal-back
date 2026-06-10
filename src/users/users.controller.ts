import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';

type CurrentUserPayload = {
  id: number;
  email: string;
  role: Role;
};

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lista usuarios del sistema con paginación, búsqueda y filtros.
   */
  @Get()
  findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * Cambia el rol de un usuario.
   */
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
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.remove(Number(id), currentUser.id);
  }
}