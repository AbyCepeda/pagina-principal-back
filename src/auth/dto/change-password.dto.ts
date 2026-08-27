import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  @MinLength(6, {
    message: 'La contraseña actual debe tener al menos 6 caracteres.',
  })
  @MaxLength(72, {
    message: 'La contraseña actual no debe superar los 72 caracteres.',
  })
  currentPassword!: string;

  @IsString({ message: 'La nueva contraseña debe ser texto.' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres.',
  })
  @MaxLength(72, {
    message: 'La nueva contraseña no debe superar los 72 caracteres.',
  })
  newPassword!: string;
}