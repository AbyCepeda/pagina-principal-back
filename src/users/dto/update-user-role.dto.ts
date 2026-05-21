import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser ADMIN o USER.' })
  role!: Role;
}