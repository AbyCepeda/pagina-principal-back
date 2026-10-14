import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('Login failure paths', () => {
  const findByEmail = jest.fn();
  const signAsync = jest.fn();
  const service = new AuthService(
    { findByEmail } as unknown as UsersService,
    { signAsync } as unknown as JwtService,
  );
  const compare = bcrypt.compare as jest.MockedFunction<
    (password: string, hash: string) => Promise<boolean>
  >;

  beforeEach(() => jest.resetAllMocks());

  it('runs bcrypt even when the email does not exist and never signs a token', async () => {
    findByEmail.mockResolvedValue(null);
    compare.mockResolvedValue(true);

    await expect(
      service.login({
        email: 'unknown@example.com',
        password: 'test-password',
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(compare).toHaveBeenCalledWith(
      'test-password',
      expect.stringMatching(/^\$2b\$10\$/),
    );
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('checks the password of an inactive account but never signs a token', async () => {
    findByEmail.mockResolvedValue({ password: 'stored-hash', isActive: false });
    compare.mockResolvedValue(true);

    await expect(
      service.login({
        email: 'inactive@example.com',
        password: 'test-password',
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(compare).toHaveBeenCalledWith('test-password', 'stored-hash');
    expect(signAsync).not.toHaveBeenCalled();
  });
});
