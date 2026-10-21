import { AuditLogAction, Prisma, Role } from '@prisma/client';
import type { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ContactCommentsService } from './contact-comments.service';

describe('ContactCommentsService', () => {
  it('audits replies sent by admins without copying the message body into metadata', async () => {
    const createLog = jest.fn().mockResolvedValue(null);
    const prisma = {
      contactMessage: {
        findUnique: jest.fn().mockResolvedValue({
          id: 42,
          email: 'client@example.com',
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          name: 'Admin',
          email: 'admin@example.com',
          role: Role.ADMIN,
        }),
      },
      contactMessageComment: {
        create: jest.fn().mockResolvedValue({ id: 91 }),
      },
    };
    const service = new ContactCommentsService(
      prisma as unknown as PrismaService,
      { createLog } as never,
    );

    await service.createComment(
      42,
      { message: 'Respuesta privada para el cliente' },
      { id: 1, email: 'admin@example.com', role: Role.ADMIN },
    );

    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditLogAction.UPDATE,
        module: 'Mensajes',
        actorId: 1,
        targetId: 42,
        targetType: 'ContactMessage',
        metadata: { commentId: 91 },
      }),
    );
  });

  it('marks the request and incoming user comments as read when admin opens it', async () => {
    const prisma = {
      contactMessage: {
        findUnique: jest.fn().mockResolvedValue({
          id: 42,
          email: 'client@example.com',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      contactMessageComment: {
        updateMany: jest.fn(
          (args: Prisma.ContactMessageCommentUpdateManyArgs) => {
            expect(args.where).toEqual({
              contactMessageId: 42,
              senderRole: Role.USER,
              readAt: null,
            });
            expect(args.data.readAt).toBeInstanceOf(Date);
            return Promise.resolve({ count: 1 });
          },
        ),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ContactCommentsService(
      prisma as unknown as PrismaService,
      { createLog: jest.fn() } as never,
    );
    const admin = {
      id: 1,
      email: 'admin@example.com',
      role: Role.ADMIN,
    } as CurrentUser;

    await service.findComments(42, admin);

    expect(prisma.contactMessage.updateMany).toHaveBeenCalledWith({
      where: { id: 42, isRead: false },
      data: { isRead: true },
    });
    expect(prisma.contactMessageComment.updateMany).toHaveBeenCalledTimes(1);
  });
});
