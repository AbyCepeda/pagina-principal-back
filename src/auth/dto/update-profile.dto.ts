import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(120, { message: 'El nombre no debe superar los 120 caracteres.' })
  name!: string;

  @IsEmail({}, { message: 'El correo debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email!: string;
}