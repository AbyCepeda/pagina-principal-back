import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser mínimo 1.' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser mínimo 1.' })
  @Max(50, { message: 'limit no debe ser mayor a 50.' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'search debe ser texto.' })
  search?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'role debe ser USER o ADMIN.' })
  role?: Role;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive debe ser true o false.' })
  isActive?: boolean;
}