import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role, type User, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getStorageToken, ThrottlerStorageService } from '@nestjs/throttler';

describe('API authentication and permissions (Jest + Supertest)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let users: User[];
  let passwordHash: string;
  const password = 'test-password-unique';
  const prisma = {
    user: {
      findUnique: jest.fn((args: Prisma.UserFindUniqueArgs) => {
        const user = users.find((item) =>
          args.where.id !== undefined
            ? item.id === args.where.id
            : item.email === args.where.email,
        );
        if (!user) return Promise.resolve(null);
        if (!args.select) return Promise.resolve({ ...user });
        return Promise.resolve(
          Object.fromEntries(
            Object.keys(args.select)
              .filter((key) => args.select?.[key])
              .map((key) => [key, user[key]]),
          ),
        );
      }),
      create: jest.fn((args: Prisma.UserCreateArgs) => {
        const user: User = {
          id: 10,
          name: String(args.data.name),
          email: String(args.data.email),
          password: String(args.data.password),
          role: Role.USER,
          isActive: false,
          projectRequestLimit: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(user);
        const { password: ignored, ...safeUser } = user;
        void ignored;
        return Promise.resolve(safeUser);
      }),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
    },
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
  };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 4);
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    jwt = moduleFixture.get(JwtService);
    await app.init();
  });

  beforeEach(() => {
    // Cada caso tiene su propia ventana; el guard real sigue activo.
    const storage = app.get<ThrottlerStorageService>(getStorageToken());
    storage.onApplicationShutdown();
    storage.storage.clear();
    jest.clearAllMocks();
    users = [Role.ADMIN, Role.USER].map((role, index) => ({
      id: index + 1,
      name: role,
      email: `${role.toLowerCase()}@example.com`,
      password: passwordHash,
      role,
      isActive: true,
      projectRequestLimit: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  function token(user = users[0], options = {}) {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      options,
    );
  }

  it('serves the root and health endpoints without authentication', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    expect(response.body).toEqual(expect.objectContaining({ status: 'ok' }));
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not expose Swagger when disabled', async () => {
    await request(app.getHttpServer()).get('/docs').expect(404);
    await request(app.getHttpServer()).get('/docs-json').expect(404);
  });

  it('logs in with bcrypt and returns a usable JWT without password data', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password })
      .expect(201);
    const body = response.body as {
      data: { accessToken: string; user: Record<string, unknown> };
    };
    expect(body.data.user).not.toHaveProperty('password');
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${body.data.accessToken}`)
      .expect(200);
    expect(
      (me.body as { data: Record<string, unknown> }).data,
    ).not.toHaveProperty('password');
  });

  it('accepts an existing short password with leading and trailing spaces exactly as stored', async () => {
    users[0].password = await bcrypt.hash(' old123 ', 4);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: users[0].email, password: ' old123 ' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: users[0].email, password: 'old123' })
      .expect(401);
  });

  it.each(['a'.repeat(14), 'á'.repeat(37), ' '.repeat(20)])(
    'rejects unsafe new passwords before querying data',
    async (newPassword) => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'new@example.com',
          password: newPassword,
        })
        .expect(400);
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token()}`)
        .send({
          name: 'Test User',
          email: 'new@example.com',
          password: newPassword,
        })
        .expect(400);
      const callsAfterAdminGuard = prisma.user.findUnique.mock.calls.length;
      await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${token()}`)
        .send({ currentPassword: password, newPassword })
        .expect(400);
      expect(prisma.user.findUnique.mock.calls.length).toBe(
        callsAfterAdminGuard + 1,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    { email: 'unknown@example.com', password },
    { email: 'admin@example.com', password: 'wrong-password' },
  ])('rejects incorrect credentials', async (credentials) => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(401);
  });

  it('rejects login for an inactive account', async () => {
    users[0].isActive = false;
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: users[0].email, password })
      .expect(401);
  });

  it('returns the same error for unknown, incorrect and inactive credentials', async () => {
    users[1].isActive = false;
    const responses = [];
    for (const credentials of [
      { email: 'unknown@example.com', password },
      { email: users[0].email, password: 'wrong-password' },
      { email: users[1].email, password },
      { email: users[1].email, password: 'wrong-password' },
    ]) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(401);
      responses.push(response.body as unknown);
    }
    for (const body of responses) {
      expect(body).toEqual(responses[0]);
      expect(body).not.toHaveProperty('data.accessToken');
    }
  });

  it.each([
    { email: 'invalid', password },
    { email: 'admin@example.com' },
    { email: 'admin@example.com', password, role: 'ADMIN' },
  ])(
    'validates login input and rejects extra fields before querying data',
    async (body) => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(body)
        .expect(400);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it('creates public registrations as inactive USER accounts with hashed passwords', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Nueva cuenta', email: 'new@example.com', password })
      .expect(201);
    const body = response.body as { data: Record<string, unknown> };
    expect(body.data).toMatchObject({ role: Role.USER, isActive: false });
    expect(body.data).not.toHaveProperty('password');
    const created = users.find((user) => user.email === 'new@example.com')!;
    expect(created.password).not.toBe(password);
    expect(await bcrypt.compare(password, created.password)).toBe(true);
  });

  it('rejects a duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Duplicado', email: users[0].email, password })
      .expect(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('prevents assigning ADMIN role through public registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Nueva cuenta',
        email: 'new@example.com',
        password,
        role: 'ADMIN',
      })
      .expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    '/auth/me',
    '/users',
    '/contact',
    '/audit-logs',
    '/dashboard/summary',
    '/landing-sections',
  ])('rejects protected endpoint %s without a token', async (url) => {
    await request(app.getHttpServer()).get(url).expect(401);
  });

  it('rejects expired tokens', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token(users[0], { expiresIn: -1 })}`)
      .expect(401);
  });

  it('rejects tokens signed with another secret', async () => {
    const forged = new JwtService({ secret: 'another-secret' }).sign({
      sub: 1,
      role: Role.ADMIN,
    });
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${forged}`)
      .expect(401);
  });

  it('allows an active ADMIN to list users', async () => {
    await request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .set('Authorization', `Bearer ${token()}`)
      .expect(200);
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it.each([
    '/users',
    '/contact',
    '/audit-logs',
    '/dashboard/summary',
    '/landing-sections',
  ])('rejects USER access to admin endpoint %s', async (url) => {
    await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${token(users[1])}`)
      .expect(403);
  });

  it('uses the current role when the JWT still claims ADMIN', async () => {
    const oldToken = token();
    users[0].role = Role.USER;
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('revokes access immediately after deactivation', async () => {
    const oldToken = token();
    users[0].isActive = false;
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(401);
  });

  it('revokes access after account deletion', async () => {
    const oldToken = token();
    users.shift();
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(401);
  });

  it.each(['limit=51', 'page=0', 'isActive=invalid'])(
    'validates user filters: %s',
    async (query) => {
      await request(app.getHttpServer())
        .get(`/users?${query}`)
        .set('Authorization', `Bearer ${token()}`)
        .expect(400);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    },
  );

  afterAll(async () => {
    if (app) await app.close();
  });
});
