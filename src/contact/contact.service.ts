import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ContactStatus, Prisma } from '@prisma/client';
import { LeadAgentService } from '../lead-agent/lead-agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { calculateQuote } from './quote-estimator';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadAgentService: LeadAgentService,
  ) {}

  async previewQuote(slug: string, extraIds: string[]) {
    const plan = await this.prisma.plan.findUnique({
      where: { slug: slug.trim() },
    });
    if (!plan || !plan.isActive)
      throw new BadRequestException(
        'El paquete seleccionado no está disponible.',
      );
    return calculateQuote(plan, extraIds);
  }

  /**
   * Crea una solicitud de contacto desde la landing.
   *
   * Antes de guardar valida cuántas solicitudes activas tiene el correo.
   * Si el usuario existe, usa su límite personalizado.
   * Si no existe, aplica límite base de 3.
   */
  async create(createContactDto: CreateContactDto) {
    try {
      const normalizedContact = {
        name: createContactDto.name.trim(),
        email: createContactDto.email.trim().toLowerCase(),
        projectType: createContactDto.projectType.trim(),
        budget: createContactDto.budget.trim(),
        message: createContactDto.message.trim(),
      };

      const extraIds = createContactDto.quoteExtraIds ?? [];
      let quote: ReturnType<typeof calculateQuote> | undefined;
      if (createContactDto.quotePlanSlug != null) {
        quote = await this.previewQuote(
          createContactDto.quotePlanSlug,
          extraIds,
        );
        if (quote.quoteMaxPrice !== null)
          normalizedContact.budget = quote.quoteSuggestedBudget;
      } else if (extraIds.length > 0) {
        throw new BadRequestException(
          'Selecciona un paquete para cotizar extras.',
        );
      }
      await this.validateActiveRequestLimit(normalizedContact.email);

      const analysis = this.leadAgentService.analyzeLead(normalizedContact);

      const contactMessage = await this.prisma.contactMessage.create({
        data: {
          ...normalizedContact,

          status: analysis.status,
          priority: analysis.priority,

          agentSummary: analysis.summary,
          agentSuggestedAction: analysis.suggestedAction,
          agentSuggestedReply: analysis.suggestedReply,
          agentScore: analysis.score,
          agentTags: analysis.tags,

          ...quote,
        },
      });

      return {
        success: true,
        message: 'Mensaje guardado correctamente.',
        data: contactMessage,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error al guardar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo guardar el mensaje de contacto.',
      );
    }
  }

  /**
   * Valida el límite de solicitudes activas por correo.
   *
   * Activas:
   * - NEW
   * - REVIEWING
   * - CONTACTED
   *
   * CLOSED no cuenta contra el límite.
   */
  private async validateActiveRequestLimit(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        projectRequestLimit: true,
      },
    });

    const requestLimit = user?.projectRequestLimit ?? 3;

    const activeRequestsCount = await this.prisma.contactMessage.count({
      where: {
        email: normalizedEmail,
        status: {
          in: [
            ContactStatus.NEW,
            ContactStatus.REVIEWING,
            ContactStatus.CONTACTED,
          ],
        },
      },
    });

    if (activeRequestsCount >= requestLimit) {
      throw new BadRequestException(
        `Este correo ya tiene ${activeRequestsCount} solicitudes activas. El límite actual es de ${requestLimit}. Espera a que una solicitud sea cerrada o contacta al administrador.`,
      );
    }
  }

  /**
   * Lista mensajes para ADMIN con búsqueda, filtros y paginación.
   */
  async findAll(query: GetContactMessagesQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const search = query.search?.trim();

      const where: Prisma.ContactMessageWhereInput = {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  projectType: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  budget: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  message: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  adminNotes: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  adminPublicReply: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  quotePlanName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  technicalSummary: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),

        ...(typeof query.isRead === 'boolean'
          ? {
              isRead: query.isRead,
            }
          : {}),

        ...(query.status
          ? {
              status: query.status,
            }
          : {}),

        ...(query.priority
          ? {
              priority: query.priority,
            }
          : {}),
      };

      const [messages, total] = await this.prisma.$transaction([
        this.prisma.contactMessage.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.contactMessage.count({
          where,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Mensajes obtenidos correctamente.',
        data: messages,
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
      console.error('Error al obtener mensajes de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los mensajes de contacto.',
      );
    }
  }

  /**
   * Permite que el usuario autenticado vea sus propias solicitudes.
   *
   * De momento se relacionan por correo.
   */
  async findMyMessages(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          email: true,
          projectRequestLimit: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const normalizedEmail = user.email.trim().toLowerCase();

      const [messages, activeRequestsCount] = await this.prisma.$transaction([
        this.prisma.contactMessage.findMany({
          where: {
            email: normalizedEmail,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            name: true,
            email: true,
            projectType: true,
            budget: true,
            message: true,
            isRead: true,
            status: true,
            priority: true,
            contactedAt: true,

            adminPublicReply: true,
            adminReplyAt: true,

            quotePlanSlug: true,
            quotePlanName: true,
            quoteMinPrice: true,
            quoteMaxPrice: true,
            quoteSuggestedBudget: true,
            quoteComplexity: true,
            quoteEstimatedTime: true,
            quoteExtras: true,
            quoteSnapshot: true,

            createdAt: true,
            updatedAt: true,
          },
        }),

        this.prisma.contactMessage.count({
          where: {
            email: normalizedEmail,
            status: {
              in: [
                ContactStatus.NEW,
                ContactStatus.REVIEWING,
                ContactStatus.CONTACTED,
              ],
            },
          },
        }),
      ]);

      return {
        success: true,
        message: 'Solicitudes obtenidas correctamente.',
        data: messages,
        meta: {
          activeRequestsCount,
          requestLimit: user.projectRequestLimit,
          remainingRequests: Math.max(
            user.projectRequestLimit - activeRequestsCount,
            0,
          ),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener solicitudes del usuario:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener tus solicitudes.',
      );
    }
  }
}
