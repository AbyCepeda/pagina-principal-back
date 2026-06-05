import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
}