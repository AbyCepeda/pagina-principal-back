import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @ApiProperty({ example: 'usuario@example.com', format: 'email' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @MaxLength(1024, {
    message: 'La contraseña no debe superar los 1024 caracteres.',
  })
  @ApiProperty({ format: 'password', writeOnly: true, maxLength: 1024 })
  password!: string;
}
