import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(120, { message: 'El nombre no debe superar los 120 caracteres.' })
  name!: string;

  @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email!: string;

  @IsString({ message: 'El tipo de proyecto debe ser texto.' })
  @IsNotEmpty({ message: 'El tipo de proyecto es obligatorio.' })
  projectType!: string;

  @IsString({ message: 'El presupuesto debe ser texto.' })
  @IsNotEmpty({ message: 'El presupuesto es obligatorio.' })
  budget!: string;

  @IsString({ message: 'El mensaje debe ser texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres.' })
  message!: string;

  @IsOptional()
  @IsString({ message: 'quotePlanSlug debe ser texto.' })
  @MaxLength(120, {
    message: 'quotePlanSlug no debe superar los 120 caracteres.',
  })
  quotePlanSlug?: string;

  @IsOptional()
  @IsString({ message: 'quotePlanName debe ser texto.' })
  @MaxLength(120, {
    message: 'quotePlanName no debe superar los 120 caracteres.',
  })
  quotePlanName?: string;

  @IsOptional()
  @IsInt({ message: 'quoteMinPrice debe ser un número entero.' })
  @Min(0, { message: 'quoteMinPrice no puede ser menor a 0.' })
  quoteMinPrice?: number;

  @IsOptional()
  @IsInt({ message: 'quoteMaxPrice debe ser un número entero.' })
  @Min(0, { message: 'quoteMaxPrice no puede ser menor a 0.' })
  quoteMaxPrice?: number;

  @IsOptional()
  @IsString({ message: 'quoteSuggestedBudget debe ser texto.' })
  @MaxLength(120, {
    message: 'quoteSuggestedBudget no debe superar los 120 caracteres.',
  })
  quoteSuggestedBudget?: string;

  @IsOptional()
  @IsString({ message: 'quoteComplexity debe ser texto.' })
  @MaxLength(40, {
    message: 'quoteComplexity no debe superar los 40 caracteres.',
  })
  quoteComplexity?: string;

  @IsOptional()
  @IsString({ message: 'quoteEstimatedTime debe ser texto.' })
  @MaxLength(120, {
    message: 'quoteEstimatedTime no debe superar los 120 caracteres.',
  })
  quoteEstimatedTime?: string;

  @IsOptional()
  @IsArray({ message: 'quoteExtras debe ser una lista.' })
  @IsObject({ each: true, message: 'Cada extra debe ser un objeto.' })
  quoteExtras?: Record<string, unknown>[];

  @IsOptional()
  @IsObject({ message: 'quoteSnapshot debe ser un objeto.' })
  quoteSnapshot?: Record<string, unknown>;
}