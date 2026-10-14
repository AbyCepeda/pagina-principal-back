import { ValidateBy } from 'class-validator';
import { isValidNewPassword } from './password-policy';

export function IsNewPassword() {
  return ValidateBy({
    name: 'isNewPassword',
    validator: {
      validate: isValidNewPassword,
      defaultMessage: () =>
        'La contraseña debe tener al menos 15 caracteres, incluir algún carácter distinto de espacios y no superar 72 bytes UTF-8.',
    },
  });
}
