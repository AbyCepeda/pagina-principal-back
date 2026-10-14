import { validateSync } from 'class-validator';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { ChangePasswordDto } from '../src/auth/dto/change-password.dto';
import { LoginDto } from '../src/auth/dto/login.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { getSeedAdminCredentials } from '../prisma/seed-credentials';

describe('New password policy across entry points', () => {
  it.each([
    ['a'.repeat(14), false],
    ['a'.repeat(15), true],
    ['a'.repeat(72), true],
    ['a'.repeat(73), false],
    ['á'.repeat(36), true],
    ['á'.repeat(37), false],
    ['😀'.repeat(14), false],
    ['😀'.repeat(18), true],
    ['😀'.repeat(19), false],
    [' '.repeat(20), false],
    [' mi frase larga con espacios ', true],
    [123456789012345, false],
  ])('validates %p consistently (valid: %p)', (password, valid) => {
    for (const [Dto, field] of [
      [RegisterDto, 'password'],
      [CreateUserDto, 'password'],
      [ChangePasswordDto, 'newPassword'],
    ] as const) {
      const dto = Object.assign(new Dto(), { [field]: password });
      const errors = validateSync(dto).filter(
        (error) => error.property === field,
      );
      expect(errors.length === 0).toBe(valid);
    }
    if (typeof password === 'string') {
      const runSeedValidation = () =>
        getSeedAdminCredentials({
          SEED_ADMIN_EMAIL: 'admin@example.com',
          SEED_ADMIN_PASSWORD: password,
        });
      if (valid)
        expect(runSeedValidation()).toEqual({
          email: 'admin@example.com',
          password,
        });
      else expect(runSeedValidation).toThrow();
    }
  });

  it('allows legacy passwords in login and current-password fields without applying the new minimum', () => {
    const login = Object.assign(new LoginDto(), {
      email: 'user@example.com',
      password: 'old123',
    });
    const change = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'old123',
      newPassword: 'una nueva frase larga',
    });
    expect(validateSync(login)).toHaveLength(0);
    expect(validateSync(change)).toHaveLength(0);
  });

  it('caps comparison inputs without applying the 72-byte rule to legacy passwords', () => {
    for (const [Dto, field] of [
      [LoginDto, 'password'],
      [ChangePasswordDto, 'currentPassword'],
    ] as const) {
      const dto = Object.assign(new Dto(), { [field]: 'a'.repeat(1025) });
      expect(validateSync(dto).some((error) => error.property === field)).toBe(
        true,
      );
    }
  });
});
