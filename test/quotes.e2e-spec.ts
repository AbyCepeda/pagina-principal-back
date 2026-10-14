import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

describe('Quote API integrity', () => {
  let app: INestApplication<App>;
  const plan = {
    slug: 'landing-basica',
    name: 'Nombre del servidor',
    subtitle: '',
    description: '',
    idealFor: '',
    isActive: true,
  };
  const prisma = {
    user: { findUnique: jest.fn(() => Promise.resolve(null)) },
    plan: {
      findUnique: jest.fn(() => Promise.resolve<typeof plan | null>(plan)),
    },
    contactMessage: {
      count: jest.fn(() => Promise.resolve(0)),
      create: jest.fn((args: Prisma.ContactMessageCreateArgs) =>
        Promise.resolve({ id: 1, ...args.data }),
      ),
    },
  };
  const body = {
    name: 'Cliente de prueba',
    email: 'quote@example.com',
    projectType: 'Landing page',
    budget: 'Presupuesto escrito por cliente',
    message: 'Necesito una página para mi negocio.',
    quotePlanSlug: 'landing-basica',
    quoteExtraIds: ['custom-design'],
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.plan.findUnique.mockResolvedValue({ ...plan });
    prisma.contactMessage.count.mockResolvedValue(0);
  });

  it('serves the public quote catalog without accessing the database', async () => {
    const response = await request(app.getHttpServer())
      .get('/contact/quote-catalog')
      .expect(200);
    const data = (
      response.body as {
        data: {
          extras: { id: string }[];
          planBasePrices: Record<string, { min: number }>;
        };
      }
    ).data;
    expect(data.extras.some((extra) => extra.id === 'custom-design')).toBe(
      true,
    );
    expect(data.planBasePrices['landing-basica'].min).toBe(5000);
    expect(prisma.plan.findUnique).not.toHaveBeenCalled();
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it('stores server-calculated prices, budget and snapshot', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact')
      .send(body)
      .expect(201);
    const data = (response.body as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({
      quotePlanName: 'Nombre del servidor',
      quoteMinPrice: 7500,
      quoteMaxPrice: 14000,
      budget: '$10,000 - $20,000 MXN',
      quoteComplexity: 'Baja',
      quoteSnapshot: {
        estimate: { minPrice: 7500, maxPrice: 14000 },
        plan: { name: 'Nombre del servidor' },
      },
    });
    expect(prisma.plan.findUnique).toHaveBeenCalledWith({
      where: { slug: 'landing-basica' },
    });
  });

  it.each([
    'quoteMinPrice',
    'quoteMaxPrice',
    'quotePlanName',
    'quoteSnapshot',
    'quoteExtras',
    'quoteComplexity',
    'quoteEstimatedTime',
    'quoteSuggestedBudget',
  ])('rejects client-supplied calculated field %s', async (field) => {
    await request(app.getHttpServer())
      .post('/contact')
      .send({ ...body, [field]: 0 })
      .expect(400);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it.each([['unknown-extra'], ['custom-design', 'custom-design'], [42]])(
    'rejects invalid extras %j',
    async (...ids) => {
      await request(app.getHttpServer())
        .post('/contact')
        .send({ ...body, quoteExtraIds: ids })
        .expect(400);
      expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    },
  );

  it.each([null, { ...plan, isActive: false }])(
    'rejects unavailable plans',
    async (unavailable) => {
      prisma.plan.findUnique.mockResolvedValue(unavailable);
      await request(app.getHttpServer())
        .post('/contact')
        .send(body)
        .expect(400);
      expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    },
  );

  it('allows contact without a quotation', async () => {
    const {
      quotePlanSlug: ignoredSlug,
      quoteExtraIds: ignoredExtras,
      ...contact
    } = body;
    void ignoredSlug;
    void ignoredExtras;
    const response = await request(app.getHttpServer())
      .post('/contact')
      .send(contact)
      .expect(201);
    expect(
      (response.body as { data: Record<string, unknown> }).data,
    ).not.toHaveProperty('quoteMinPrice');
    expect(prisma.plan.findUnique).not.toHaveBeenCalled();
  });
  it('rejects extras without a plan', async () => {
    await request(app.getHttpServer())
      .post('/contact')
      .send({ ...body, quotePlanSlug: undefined })
      .expect(400);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });
  it('preserves the active request limit', async () => {
    prisma.contactMessage.count.mockResolvedValue(3);
    await request(app.getHttpServer()).post('/contact').send(body).expect(400);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });
  afterAll(async () => {
    if (app) await app.close();
  });
});
