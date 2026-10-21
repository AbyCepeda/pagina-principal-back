import { Prisma, Role } from '@prisma/client';
import type { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ContactCommentsService } from './contact-comments.service';

describe('ContactCommentsService', () => {
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
