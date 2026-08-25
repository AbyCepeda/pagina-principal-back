import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AnalyzeTechnicalIdeaDto {
  @IsString({ message: 'La idea debe ser texto.' })
  @IsNotEmpty({ message: 'La idea es obligatoria.' })
  @MinLength(10, { message: 'La idea debe tener al menos 10 caracteres.' })
  @MaxLength(3000, { message: 'La idea no debe superar los 3000 caracteres.' })
  idea!: string;

  @IsOptional()
  @IsString({ message: 'El tipo de proyecto debe ser texto.' })
  @MaxLength(120, {
    message: 'El tipo de proyecto no debe superar los 120 caracteres.',
  })
  projectType?: string;

  @IsOptional()
  @IsString({ message: 'El presupuesto debe ser texto.' })
  @MaxLength(120, {
    message: 'El presupuesto no debe superar los 120 caracteres.',
  })
  budget?: string;
}