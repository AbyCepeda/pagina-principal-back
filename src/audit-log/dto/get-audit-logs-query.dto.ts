import { AuditLogAction } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetAuditLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página mínima es 1.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite mínimo es 1.' })
  @Max(100, { message: 'El límite máximo es 100.' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto.' })
  search?: string;

  @IsOptional()
  @IsEnum(AuditLogAction, {
    message: 'La acción del historial no es válida.',
  })
  action?: AuditLogAction;

  @IsOptional()
  @IsString({ message: 'El módulo debe ser texto.' })
  module?: string;
}