import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80, { message: 'El nombre no debe superar los 80 caracteres.' })
  name!: string;

  @IsString({ message: 'El tipo de proyecto debe ser texto.' })
  @IsNotEmpty({ message: 'El tipo de proyecto es obligatorio.' })
  @MaxLength(80, {
    message: 'El tipo de proyecto no debe superar los 80 caracteres.',
  })
  projectType!: string;

  @IsString({ message: 'El presupuesto debe ser texto.' })
  @IsNotEmpty({ message: 'El presupuesto es obligatorio.' })
  @MaxLength(80, { message: 'El presupuesto no debe superar los 80 caracteres.' })
  budget!: string;

  @IsString({ message: 'El mensaje debe ser texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres.' })
  @MaxLength(1000, { message: 'El mensaje no debe superar los 1000 caracteres.' })
  message!: string;
}