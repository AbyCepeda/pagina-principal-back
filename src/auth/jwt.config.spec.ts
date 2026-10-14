import { ConfigService } from '@nestjs/config';
import { getJwtSecret } from './jwt.config';

describe('JWT configuration', () => {
  it.each([undefined, '', 'dev_secret_key', ' '.repeat(32)])(
    'rejects missing or short secrets',
    (secret) => {
      expect(() =>
        getJwtSecret(new ConfigService({ JWT_SECRET: secret })),
      ).toThrow();
    },
  );

  it('uses the configured secret unchanged', () => {
    const secret = 'a'.repeat(64);
    expect(getJwtSecret(new ConfigService({ JWT_SECRET: secret }))).toBe(
      secret,
    );
  });
});
