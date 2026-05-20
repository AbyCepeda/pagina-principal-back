import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum RegisterRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class RegisterDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80, { message: 'El nombre no debe superar los 80 caracteres.' })
  name!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password!: string;

  @IsOptional()
  @IsEnum(RegisterRole, { message: 'El rol debe ser ADMIN o USER.' })
  role?: RegisterRole;
}