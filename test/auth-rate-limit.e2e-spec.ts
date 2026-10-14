import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication rate limits', () => {
  let app: INestApplication<App>;
  const findUnique = jest.fn().mockResolvedValue(null);

  beforeEach(async () => {
    findUnique.mockClear();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique } })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => app.close());

  it('blocks the eleventh login before querying data, despite forged forwarding headers', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', `192.0.2.${attempt + 1}`)
        .send({
          email: `unknown${attempt}@example.com`,
          password: 'wrong-password',
        })
        .expect(401);
    }
    expect(findUnique).toHaveBeenCalledTimes(10);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '198.51.100.1')
      .send({ email: 'another@example.com', password: 'wrong-password' })
      .expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(findUnique).toHaveBeenCalledTimes(10);
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(400);
  });

  it('counts invalid registration requests and blocks the sixth', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(429);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('limits password-change requests even without a token', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app.getHttpServer())
        .patch('/auth/change-password')
        .send({})
        .expect(401);
    }
    await request(app.getHttpServer())
      .patch('/auth/change-password')
      .send({})
      .expect(429);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
