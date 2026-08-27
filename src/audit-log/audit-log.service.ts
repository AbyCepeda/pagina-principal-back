import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuditLogAction, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';

type CreateAuditLogInput = {
  action: AuditLogAction;
  module: string;
  description: string;
  actorId?: number | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: Role | null;
  targetId?: number | null;
  targetType?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetAuditLogsQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const search = query.search?.trim();
      const module = query.module?.trim();

      const where: Prisma.AuditLogWhereInput = {
        ...(query.action
          ? {
              action: query.action,
            }
          : {}),

        ...(module
          ? {
              module: {
                contains: module,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  module: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  actorName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  actorEmail: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  targetType: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      };

      const [logs, total] = await this.prisma.$transaction([
        this.prisma.auditLog.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.auditLog.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Historial de actividad obtenido correctamente.',
        data: logs,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error al obtener historial de actividad:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el historial de actividad.',
      );
    }
  }

  async createLog(input: CreateAuditLogInput) {
    try {
      let actorData = {
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        actorEmail: input.actorEmail ?? null,
        actorRole: input.actorRole ?? null,
      };

      if (input.actorId && (!input.actorName || !input.actorEmail)) {
        const actor = await this.prisma.user.findUnique({
          where: {
            id: input.actorId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        if (actor) {
          actorData = {
            actorId: actor.id,
            actorName: actor.name,
            actorEmail: actor.email,
            actorRole: actor.role,
          };
        }
      }

      return await this.prisma.auditLog.create({
        data: {
          action: input.action,
          module: input.module,
          description: input.description,

          actorId: actorData.actorId,
          actorName: actorData.actorName,
          actorEmail: actorData.actorEmail,
          actorRole: actorData.actorRole,

          targetId: input.targetId ?? null,
          targetType: input.targetType ?? null,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      console.error('Error al crear registro de auditoría:', error);

      return null;
    }
  }
}