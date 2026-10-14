import { IsNewPassword } from '../../common/validation/new-password.decorator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80, { message: 'El nombre no debe superar los 80 caracteres.' })
  name!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @MaxLength(120, { message: 'El correo no debe superar los 120 caracteres.' })
  email!: string;

  @IsNewPassword()
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 15,
    maxLength: 72,
    description:
      'Mínimo 15 caracteres; máximo 72 bytes UTF-8. Se conservan los espacios.',
  })
  password!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser USER o ADMIN.' })
  role?: Role;
}
