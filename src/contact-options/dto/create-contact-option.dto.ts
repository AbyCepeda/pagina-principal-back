import { ContactOptionType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateContactOptionDto {
  @IsEnum(ContactOptionType, {
    message: 'El tipo debe ser PROJECT_TYPE o BUDGET.',
  })
  type!: ContactOptionType;

  @IsString({ message: 'La etiqueta debe ser texto.' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria.' })
  @MaxLength(120, { message: 'La etiqueta no debe superar los 120 caracteres.' })
  label!: string;

  @IsString({ message: 'El valor debe ser texto.' })
  @IsNotEmpty({ message: 'El valor es obligatorio.' })
  @MaxLength(120, { message: 'El valor no debe superar los 120 caracteres.' })
  value!: string;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser número entero.' })
  @Min(0, { message: 'El orden debe ser mínimo 0.' })
  sortOrder?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso.' })
  isActive?: boolean;
}