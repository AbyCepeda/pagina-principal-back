import { Role } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContactFollowUpService } from './contact-follow-up.service';

describe('ContactFollowUpService', () => {
  it('counts only requests with unread user comments', async () => {
    const prisma = {
      contactMessage: {
        count: jest.fn().mockResolvedValue(2),
      },
    };
    const service = new ContactFollowUpService(
      prisma as unknown as PrismaService,
      {} as AuditLogService,
    );

    await expect(service.countUnread()).resolves.toMatchObject({
      success: true,
      data: { count: 2 },
    });
    expect(prisma.contactMessage.count).toHaveBeenCalledWith({
      where: {
        comments: {
          some: {
            senderRole: Role.USER,
            readAt: null,
          },
        },
      },
    });
  });
});
