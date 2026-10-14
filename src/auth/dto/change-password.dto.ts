import { IsNewPassword } from '../../common/validation/new-password.decorator';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  @MinLength(6, {
    message: 'La contraseña actual debe tener al menos 6 caracteres.',
  })
  @MaxLength(1024, {
    message: 'La contraseña actual no debe superar los 1024 caracteres.',
  })
  @ApiProperty({ format: 'password', writeOnly: true })
  currentPassword!: string;

  @IsNewPassword()
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 15,
    maxLength: 72,
    description:
      'Mínimo 15 caracteres; máximo 72 bytes UTF-8. Se conservan los espacios.',
  })
  newPassword!: string;
}
