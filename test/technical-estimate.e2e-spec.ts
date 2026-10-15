import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Estimador técnico HTTP', () => {
  let app: INestApplication<App>;
  let token: string;
  const body = {
    idea: 'Una landing informativa sin login ni pagos',
    estimation: {
      hourlyRate: 300,
      hoursPerWeek: 20,
      contingencyPercent: 15,
      externalCosts: 0,
    },
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn(() =>
            Promise.resolve({
              id: 1,
              name: 'Admin de prueba',
              email: 'admin@example.com',
              role: 'ADMIN',
              isActive: true,
            }),
          ),
        },
      })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    token = module
      .get(JwtService)
      .sign({ sub: 1, email: 'admin@example.com', role: 'ADMIN' });
  });
  afterAll(async () => {
    await app.close();
  });

  it('requiere autenticación', async () => {
    await request(app.getHttpServer())
      .post('/technical-agent/analyze')
      .send(body)
      .expect(401);
  });
  it('calcula horas y precio con validación anidada del DTO', async () => {
    const response = await request(app.getHttpServer())
      .post('/technical-agent/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);
    expect(
      (response.body as { data: { effortEstimate: unknown } }).data
        .effortEstimate,
    ).toMatchObject({
      price: { min: 10200, max: 21900 },
      totalHours: { min: 34, max: 73 },
      weeks: { min: 2, max: 4 },
    });
  });
  it.each([
    { hourlyRate: -10 },
    { hoursPerWeek: 0 },
    { hourlyRate: '300' },
    { externalCosts: -1 },
    { fabricatedPrice: 1 },
  ])('rechaza ajustes manipulados: %j', async (estimation) => {
    await request(app.getHttpServer())
      .post('/technical-agent/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...body, estimation })
      .expect(400);
  });
  it('conserva solicitudes anteriores sin ajustes económicos', async () => {
    const response = await request(app.getHttpServer())
      .post('/technical-agent/analyze')
      .set('Authorization', `Bearer ${token}`)
      .send({ idea: body.idea })
      .expect(201);
    expect(
      (response.body as { data: { effortEstimate: unknown } }).data
        .effortEstimate,
    ).toMatchObject({ price: null, weeks: null });
  });
});
