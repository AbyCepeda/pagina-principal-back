import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres.' })
  @MaxLength(120, { message: 'El título no debe superar los 120 caracteres.' })
  title!: string;

  @IsString({ message: 'El tipo debe ser texto.' })
  @IsNotEmpty({ message: 'El tipo de proyecto es obligatorio.' })
  @MaxLength(80, { message: 'El tipo no debe superar los 80 caracteres.' })
  type!: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  description!: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser texto.' })
  image?: string;

  @IsString({ message: 'El estado debe ser texto.' })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @MaxLength(120, { message: 'El estado no debe superar los 120 caracteres.' })
  status!: string;

  @IsArray({ message: 'Las tecnologías deben ser una lista.' })
  @IsString({ each: true, message: 'Cada tecnología debe ser texto.' })
  technologies!: string[];

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser verdadero o falso.' })
  isActive?: boolean;
}