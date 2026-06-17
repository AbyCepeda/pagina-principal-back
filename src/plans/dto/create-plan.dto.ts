import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString({ message: 'name debe ser texto.' })
  @MaxLength(100, { message: 'name no debe superar los 100 caracteres.' })
  name!: string;

  @IsString({ message: 'subtitle debe ser texto.' })
  @MaxLength(150, { message: 'subtitle no debe superar los 150 caracteres.' })
  subtitle!: string;

  @IsString({ message: 'description debe ser texto.' })
  description!: string;

  @IsString({ message: 'idealFor debe ser texto.' })
  idealFor!: string;

  @IsArray({ message: 'features debe ser una lista.' })
  @IsString({ each: true, message: 'Cada feature debe ser texto.' })
  features!: string[];

  @IsString({ message: 'cta debe ser texto.' })
  @MaxLength(80, { message: 'cta no debe superar los 80 caracteres.' })
  cta!: string;

  @IsOptional()
  @IsBoolean({ message: 'highlight debe ser true o false.' })
  highlight?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser true o false.' })
  isActive?: boolean;

  @IsOptional()
  @IsInt({ message: 'sortOrder debe ser número entero.' })
  @Min(0, { message: 'sortOrder debe ser mínimo 0.' })
  sortOrder?: number;

  @IsString({ message: 'slug debe ser texto.' })
  @MaxLength(120, { message: 'slug no debe superar los 120 caracteres.' })
  slug!: string;
}
