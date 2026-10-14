import { getSeedAdminCredentials } from '../prisma/seed-credentials';

describe('Seed administrator credentials', () => {
  it('normalizes the email and preserves the exact password', () => {
    const password = ' Una-clave-larga-aleatoria ';
    expect(
      getSeedAdminCredentials({
        SEED_ADMIN_EMAIL: ' Admin@Example.com ',
        SEED_ADMIN_PASSWORD: password,
      }),
    ).toEqual({ email: 'admin@example.com', password });
  });
  it.each([
    {},
    { SEED_ADMIN_EMAIL: 'admin@example.com' },
    { SEED_ADMIN_PASSWORD: 'una-clave-larga-aleatoria' },
    {
      SEED_ADMIN_EMAIL: 'invalid',
      SEED_ADMIN_PASSWORD: 'una-clave-larga-aleatoria',
    },
  ])('rejects missing credentials or invalid email', (env) => {
    expect(() => getSeedAdminCredentials(env)).toThrow();
  });
  it.each(['123456', ' '.repeat(20), 'a'.repeat(73), 'á'.repeat(37)])(
    'rejects short, blank or oversized passwords',
    (password) => {
      expect(() =>
        getSeedAdminCredentials({
          SEED_ADMIN_EMAIL: 'admin@example.com',
          SEED_ADMIN_PASSWORD: password,
        }),
      ).toThrow();
    },
  );
  it('accepts a password at the bcrypt byte limit', () => {
    expect(() =>
      getSeedAdminCredentials({
        SEED_ADMIN_EMAIL: 'admin@example.com',
        SEED_ADMIN_PASSWORD: 'á'.repeat(36),
      }),
    ).not.toThrow();
  });
  it('does not include the password in validation errors', () => {
    const password = 'short-key';
    try {
      getSeedAdminCredentials({
        SEED_ADMIN_EMAIL: 'admin@example.com',
        SEED_ADMIN_PASSWORD: password,
      });
      throw new Error('Expected validation to reject the password');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('SEED_ADMIN_PASSWORD');
      expect((error as Error).message).not.toContain(password);
    }
  });
});
