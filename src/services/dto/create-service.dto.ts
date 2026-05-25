import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres.' })
  @MaxLength(120, { message: 'El título no debe superar los 120 caracteres.' })
  title!: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  description!: string;

  @IsString({ message: 'El icono debe ser texto.' })
  @IsNotEmpty({ message: 'El icono es obligatorio.' })
  @MaxLength(20, { message: 'El icono no debe superar los 20 caracteres.' })
  icon!: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso.' })
  isActive?: boolean;
}