import { ContactOptionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class GetContactOptionsQueryDto {
  @IsOptional()
  @IsEnum(ContactOptionType, {
    message: 'El tipo debe ser PROJECT_TYPE o BUDGET.',
  })
  type?: ContactOptionType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive debe ser true o false.' })
  isActive?: boolean;

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
}