import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import {
  Role,
  ContactStatus,
  ContactPriority,
  AuditLogAction,
  type Prisma,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Contact workflows after service separation', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const users = [
    {
      id: 1,
      email: 'owner@example.com',
      name: 'Owner',
      role: Role.USER,
      isActive: true,
    },
    {
      id: 2,
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.ADMIN,
      isActive: true,
    },
    {
      id: 3,
      email: 'other@example.com',
      name: 'Other',
      role: Role.USER,
      isActive: true,
    },
  ];
  const message = {
    id: 11,
    email: users[0].email,
    name: 'Cliente',
    projectType: 'Sistema web',
    budget: '20000',
    message: 'Necesito inventario de productos y reportes.',
    isRead: true,
    status: ContactStatus.NEW,
    priority: ContactPriority.NORMAL,
    contactedAt: null,
  };
  const prisma = {
    user: {
      findUnique: jest.fn((args: Prisma.UserFindUniqueArgs) =>
        Promise.resolve(
          users.find((user) => user.id === args.where.id) ?? null,
        ),
      ),
    },
    contactMessage: {
      findUnique: jest.fn(() =>
        Promise.resolve<typeof message | null>(message),
      ),
      update: jest.fn((args: Prisma.ContactMessageUpdateArgs) =>
        Promise.resolve({ ...message, ...args.data }),
      ),
    },
    contactMessageComment: {
      findMany: jest.fn(() => Promise.resolve([])),
      updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
      count: jest.fn(() => Promise.resolve(2)),
      create: jest.fn((args: Prisma.ContactMessageCommentCreateArgs) =>
        Promise.resolve({ id: 1, ...args.data }),
      ),
    },
    auditLog: { create: jest.fn(() => Promise.resolve({ id: 1 })) },
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    jwt = module.get(JwtService);
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  function token(id: number) {
    const user = users.find((item) => item.id === id)!;
    return `Bearer ${jwt.sign({ sub: id, role: user.role, email: user.email })}`;
  }

  it('lets the owner read comments and marks only admin replies as read', async () => {
    await request(app.getHttpServer())
      .get('/contact/11/comments')
      .set('Authorization', token(1))
      .expect(200);
    expect(prisma.contactMessageComment.updateMany).toHaveBeenCalledWith({
      where: { contactMessageId: 11, senderRole: Role.ADMIN, readAt: null },
      data: { readAt: expect.any(Date) as unknown },
    });
  });
  it('lets ADMIN read another user conversation', async () => {
    await request(app.getHttpServer())
      .get('/contact/11/comments')
      .set('Authorization', token(2))
      .expect(200);
    expect(prisma.contactMessageComment.updateMany).toHaveBeenCalledWith({
      where: { contactMessageId: 11, senderRole: Role.USER, readAt: null },
      data: { readAt: expect.any(Date) as unknown },
    });
  });
  it.each(['get', 'post'] as const)(
    'rejects another account trying to %s comments',
    async (verb) => {
      const call = request(app.getHttpServer())
        [verb]('/contact/11/comments')
        .set('Authorization', token(3));
      if (verb === 'post') call.send({ message: 'Intento de acceso ajeno' });
      await call.expect(403);
      expect(prisma.contactMessageComment.findMany).not.toHaveBeenCalled();
      expect(prisma.contactMessageComment.create).not.toHaveBeenCalled();
      expect(prisma.contactMessageComment.updateMany).not.toHaveBeenCalled();
    },
  );
  it('stores comments with the real author and reopens unread state for ADMIN', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact/11/comments')
      .set('Authorization', token(1))
      .send({ message: '  Necesito más información  ' })
      .expect(201);
    expect((response.body as { data: unknown }).data).toMatchObject({
      senderId: 1,
      senderRole: Role.USER,
      senderEmail: users[0].email,
      message: 'Necesito más información',
    });
    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { isRead: false },
    });
  });
  it('limits unread comment counts to the user email', async () => {
    await request(app.getHttpServer())
      .get('/contact/comments/unread-count')
      .set('Authorization', token(1))
      .expect(200);
    expect(prisma.contactMessageComment.count).toHaveBeenCalledWith({
      where: {
        readAt: null,
        senderRole: Role.ADMIN,
        contactMessage: { email: users[0].email },
      },
    });
  });
  it.each(['   ', ' a ', '', 42, 'x'.repeat(2001)])(
    'rejects an invalid comment before writing: %p',
    async (comment) => {
      await request(app.getHttpServer())
        .post('/contact/11/comments')
        .set('Authorization', token(1))
        .send({ message: comment })
        .expect(400);
      expect(prisma.contactMessageComment.create).not.toHaveBeenCalled();
      expect(prisma.contactMessage.update).not.toHaveBeenCalled();
    },
  );
  it('accepts a comment at the 2000-character limit', async () => {
    await request(app.getHttpServer())
      .post('/contact/11/comments')
      .set('Authorization', token(1))
      .send({ message: 'x'.repeat(2000) })
      .expect(201);
    expect(prisma.contactMessageComment.create).toHaveBeenCalledTimes(1);
  });
  it('keeps the public reply and its date untouched when only notes change', async () => {
    await request(app.getHttpServer())
      .patch('/contact/11')
      .set('Authorization', token(2))
      .send({ adminNotes: '  Nota interna  ' })
      .expect(200);
    expect(prisma.contactMessage.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { adminNotes: 'Nota interna' },
    });
  });
  it('forbids the owner from changing administrative follow-up', async () => {
    await request(app.getHttpServer())
      .patch('/contact/11')
      .set('Authorization', token(1))
      .send({
        status: ContactStatus.CLOSED,
        adminPublicReply: 'Falsa respuesta',
      })
      .expect(403);
    expect(prisma.contactMessage.update).not.toHaveBeenCalled();
  });
  it('returns 404 for missing conversations', async () => {
    prisma.contactMessage.findUnique.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .get('/contact/11/comments')
      .set('Authorization', token(1))
      .expect(404);
    expect(prisma.contactMessageComment.updateMany).not.toHaveBeenCalled();
  });
  it('updates follow-up and retains the audit actor', async () => {
    await request(app.getHttpServer())
      .patch('/contact/11')
      .set('Authorization', token(2))
      .send({
        status: ContactStatus.CONTACTED,
        adminPublicReply: '  Estamos revisando  ',
      })
      .expect(200);
    expect(prisma.contactMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ContactStatus.CONTACTED,
          adminPublicReply: 'Estamos revisando',
          contactedAt: expect.any(Date) as unknown,
        }) as unknown,
      }) as unknown,
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 2,
          action: AuditLogAction.UPDATE,
          targetId: 11,
        }) as unknown,
      }) as unknown,
    );
  });
  it('generates technical analysis and audits it', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact/11/technical-analysis')
      .set('Authorization', token(2))
      .expect(201);
    const data = (
      response.body as { data: { technicalSuggestedTables: string[] } }
    ).data;
    expect(data.technicalSuggestedTables).toEqual(
      expect.arrayContaining(['products', 'stock_movements']),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorId: 2,
          action: AuditLogAction.GENERATE_ANALYSIS,
        }) as unknown,
      }) as unknown,
    );
  });
  it('forbids USER from generating technical analysis', async () => {
    await request(app.getHttpServer())
      .post('/contact/11/technical-analysis')
      .set('Authorization', token(1))
      .expect(403);
    expect(prisma.contactMessage.update).not.toHaveBeenCalled();
  });
  afterAll(async () => {
    if (app) await app.close();
  });
});
