import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const findById = jest.fn();
  const strategy = new JwtStrategy(
    new ConfigService({ JWT_SECRET: 'a'.repeat(64) }),
    { findById } as unknown as UsersService,
  );
  const payload = { sub: 1, email: 'old@example.com', role: Role.ADMIN };

  beforeEach(() => findById.mockReset());

  it('uses the current role and email instead of stale token claims', async () => {
    findById.mockResolvedValue({
      id: 1,
      email: 'current@example.com',
      role: Role.USER,
      isActive: true,
    });
    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 1,
      email: 'current@example.com',
      role: Role.USER,
    });
    expect(findById).toHaveBeenCalledWith(1);
  });

  it.each([null, { id: 1, isActive: false }])(
    'rejects deleted or inactive users even with a valid token',
    async (user) => {
      findById.mockResolvedValue(user);
      await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );

  it.each([0, -1, 1.5, NaN])(
    'rejects invalid user identifiers',
    async (sub) => {
      await expect(
        strategy.validate({ ...payload, sub }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(findById).not.toHaveBeenCalled();
    },
  );
});
