import { isValidNewPassword } from '../src/common/validation/password-policy';
import { isEmail } from 'class-validator';

export function getSeedAdminCredentials(env: NodeJS.ProcessEnv) {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SEED_ADMIN_PASSWORD;

  if (!email || !isEmail(email)) {
    throw new Error('Configura SEED_ADMIN_EMAIL con un correo válido.');
  }

  if (!isValidNewPassword(password)) {
    throw new Error(
      'SEED_ADMIN_PASSWORD debe tener al menos 15 caracteres y no superar 72 bytes UTF-8.',
    );
  }

  return { email, password };
}
