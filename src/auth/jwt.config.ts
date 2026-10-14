import { ConfigService } from '@nestjs/config';

export function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');

  if (!secret || secret.trim().length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
  }

  return secret;
}
