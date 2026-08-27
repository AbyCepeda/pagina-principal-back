import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, ContactStatus, Prisma, Role } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LeadAgentService } from '../lead-agent/lead-agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactCommentDto } from './dto/create-contact-comment.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { GetContactMessagesQueryDto } from './dto/get-contact-messages-query.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

type CurrentUserPayload = {
  id: number;
  email: string;
  role: Role;
};

type TechnicalAnalysisInput = {
  projectType: string;
  budget: string;
  message: string;
};

type TechnicalAnalysisResult = {
  technicalSummary: string;
  technicalDifficulty: string;
  technicalEstimatedTime: string;
  technicalSuggestedModules: string[];
  technicalSuggestedTables: string[];
  technicalSuggestedEndpoints: string[];
  technicalSuggestedScreens: string[];
  technicalChecklist: string[];
  technicalNotes: string;
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadAgentService: LeadAgentService,
    private readonly auditLogService: AuditLogService,
  ) {}

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

          ...(typeof createContactDto.quotePlanSlug === 'string'
            ? { quotePlanSlug: createContactDto.quotePlanSlug.trim() }
            : {}),

          ...(typeof createContactDto.quotePlanName === 'string'
            ? { quotePlanName: createContactDto.quotePlanName.trim() }
            : {}),

          ...(typeof createContactDto.quoteMinPrice === 'number'
            ? { quoteMinPrice: createContactDto.quoteMinPrice }
            : {}),

          ...(typeof createContactDto.quoteMaxPrice === 'number'
            ? { quoteMaxPrice: createContactDto.quoteMaxPrice }
            : {}),

          ...(typeof createContactDto.quoteSuggestedBudget === 'string'
            ? {
                quoteSuggestedBudget:
                  createContactDto.quoteSuggestedBudget.trim(),
              }
            : {}),

          ...(typeof createContactDto.quoteComplexity === 'string'
            ? { quoteComplexity: createContactDto.quoteComplexity.trim() }
            : {}),

          ...(typeof createContactDto.quoteEstimatedTime === 'string'
            ? {
                quoteEstimatedTime:
                  createContactDto.quoteEstimatedTime.trim(),
              }
            : {}),

          ...(Array.isArray(createContactDto.quoteExtras)
            ? {
                quoteExtras:
                  createContactDto.quoteExtras as Prisma.InputJsonValue,
              }
            : {}),

          ...(createContactDto.quoteSnapshot
            ? {
                quoteSnapshot:
                  createContactDto.quoteSnapshot as Prisma.InputJsonValue,
              }
            : {}),
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

  /**
   * Verifica que el usuario autenticado pueda acceder a una solicitud.
   *
   * ADMIN puede acceder a cualquier solicitud.
   * USER solo puede acceder si el correo de la solicitud coincide con su correo.
   */
  private async validateMessageAccess(
    contactMessageId: number,
    user: CurrentUserPayload,
  ) {
    const message = await this.prisma.contactMessage.findUnique({
      where: {
        id: contactMessageId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (user.role === Role.ADMIN) {
      return message;
    }

    const messageEmail = message.email.trim().toLowerCase();
    const userEmail = user.email.trim().toLowerCase();

    if (messageEmail !== userEmail) {
      throw new ForbiddenException(
        'No tienes permisos para ver esta solicitud.',
      );
    }

    return message;
  }

  /**
   * Devuelve el rol contrario.
   *
   * Si quien abre es ADMIN, los mensajes pendientes son los del USER.
   * Si quien abre es USER, los mensajes pendientes son los del ADMIN.
   */
  private getOppositeRole(role: Role) {
    return role === Role.ADMIN ? Role.USER : Role.ADMIN;
  }

  /**
   * Cuenta comentarios no leídos para el usuario autenticado.
   *
   * ADMIN:
   * Cuenta todos los comentarios enviados por USER que no tengan readAt.
   *
   * USER:
   * Cuenta comentarios enviados por ADMIN que no tengan readAt
   * y que pertenezcan a solicitudes de su mismo correo.
   */
  async countUnreadComments(user: CurrentUserPayload) {
    try {
      const oppositeRole = this.getOppositeRole(user.role);

      const where: Prisma.ContactMessageCommentWhereInput = {
        readAt: null,
        senderRole: oppositeRole,

        ...(user.role === Role.USER
          ? {
              contactMessage: {
                email: user.email.trim().toLowerCase(),
              },
            }
          : {}),
      };

      const count = await this.prisma.contactMessageComment.count({
        where,
      });

      return {
        success: true,
        message: 'Comentarios no leídos obtenidos correctamente.',
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('Error al contar comentarios no leídos:', error);

      throw new InternalServerErrorException(
        'No se pudieron contar los comentarios no leídos.',
      );
    }
  }

  /**
   * Obtiene los comentarios de una solicitud.
   *
   * Al abrir la conversación, marca como leídos los comentarios del otro rol.
   */
  async findComments(contactMessageId: number, user: CurrentUserPayload) {
    try {
      await this.validateMessageAccess(contactMessageId, user);

      const oppositeRole = this.getOppositeRole(user.role);

      await this.prisma.contactMessageComment.updateMany({
        where: {
          contactMessageId,
          senderRole: oppositeRole,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      const comments = await this.prisma.contactMessageComment.findMany({
        where: {
          contactMessageId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        success: true,
        message: 'Comentarios obtenidos correctamente.',
        data: comments,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('Error al obtener comentarios:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los comentarios.',
      );
    }
  }

  /**
   * Crea un comentario dentro de una solicitud.
   */
  async createComment(
    contactMessageId: number,
    createContactCommentDto: CreateContactCommentDto,
    user: CurrentUserPayload,
  ) {
    try {
      await this.validateMessageAccess(contactMessageId, user);

      const author = await this.prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          name: true,
          email: true,
          role: true,
        },
      });

      if (!author) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const comment = await this.prisma.contactMessageComment.create({
        data: {
          contactMessageId,
          senderId: user.id,
          senderName: author.name,
          senderEmail: author.email.trim().toLowerCase(),
          senderRole: author.role,
          message: createContactCommentDto.message.trim(),
          readAt: null,
        },
      });

      /**
       * Si el usuario responde, marcamos la solicitud como no leída
       * para que el admin la vuelva a revisar.
       */
      if (author.role === Role.USER) {
        await this.prisma.contactMessage.update({
          where: {
            id: contactMessageId,
          },
          data: {
            isRead: false,
          },
        });
      }

      return {
        success: true,
        message: 'Comentario enviado correctamente.',
        data: comment,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      console.error('Error al crear comentario:', error);

      throw new InternalServerErrorException(
        'No se pudo enviar el comentario.',
      );
    }
  }

  /**
   * Agente técnico por reglas.
   *
   * Convierte una solicitud de cliente en una primera planeación técnica.
   * No usa IA externa, por lo que no consume APIs ni servidores adicionales.
   */
  private buildTechnicalAnalysis(
    input: TechnicalAnalysisInput,
  ): TechnicalAnalysisResult {
    const text = `${input.projectType} ${input.budget} ${input.message}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const modules = new Set<string>();
    const tables = new Set<string>();
    const endpoints = new Set<string>();
    const screens = new Set<string>();
    const checklist = new Set<string>();

    const addBaseWebSystem = () => {
      modules.add('Panel administrativo');
      modules.add('Gestión de usuarios');
      modules.add('Autenticación y roles');

      tables.add('users');
      tables.add('roles');

      endpoints.add('POST /auth/login');
      endpoints.add('GET /auth/me');

      screens.add('Login');
      screens.add('Dashboard principal');

      checklist.add('Definir roles y permisos del sistema');
      checklist.add('Crear modelo de usuarios en Prisma');
      checklist.add('Crear endpoints de autenticación');
      checklist.add('Proteger rutas privadas por rol');
    };

    const addCrud = (entity: string, table: string, route: string) => {
      modules.add(`Gestión de ${entity}`);
      tables.add(table);

      endpoints.add(`GET /${route}`);
      endpoints.add(`POST /${route}`);
      endpoints.add(`PATCH /${route}/:id`);
      endpoints.add(`DELETE /${route}/:id`);

      screens.add(`Listado de ${entity}`);
      screens.add(`Formulario de ${entity}`);

      checklist.add(`Crear CRUD de ${entity}`);
      checklist.add(`Agregar validaciones para ${entity}`);
    };

    addBaseWebSystem();

    if (
      text.includes('cita') ||
      text.includes('agenda') ||
      text.includes('calendario') ||
      text.includes('reservacion') ||
      text.includes('reserva')
    ) {
      modules.add('Agenda y calendario');
      modules.add('Disponibilidad de horarios');

      tables.add('appointments');
      tables.add('availability_slots');

      endpoints.add('GET /appointments');
      endpoints.add('POST /appointments');
      endpoints.add('PATCH /appointments/:id/status');

      screens.add('Calendario de citas');
      screens.add('Detalle de cita');

      checklist.add('Validar disponibilidad antes de crear una cita');
      checklist.add('Crear estados de cita: pendiente, confirmada, cancelada');
    }

    if (
      text.includes('cliente') ||
      text.includes('clientes') ||
      text.includes('crm')
    ) {
      addCrud('clientes', 'clients', 'clients');
    }

    if (
      text.includes('inventario') ||
      text.includes('stock') ||
      text.includes('producto') ||
      text.includes('productos') ||
      text.includes('almacen')
    ) {
      addCrud('productos', 'products', 'products');

      modules.add('Control de inventario');
      modules.add('Movimientos de stock');

      tables.add('stock_movements');

      endpoints.add('POST /stock-movements');
      endpoints.add('GET /stock-movements');

      screens.add('Inventario');
      screens.add('Historial de movimientos');

      checklist.add('Definir entradas y salidas de inventario');
      checklist.add('Actualizar stock automáticamente por movimiento');
    }

    if (
      text.includes('receta') ||
      text.includes('recetas') ||
      text.includes('ingrediente') ||
      text.includes('ingredientes')
    ) {
      addCrud('recetas', 'recipes', 'recipes');
      addCrud('categorías', 'categories', 'categories');

      modules.add('Gestión de ingredientes');
      modules.add('Favoritos');

      tables.add('ingredients');
      tables.add('recipe_ingredients');
      tables.add('favorites');

      endpoints.add('POST /recipes/:id/favorite');
      endpoints.add('DELETE /recipes/:id/favorite');

      screens.add('Detalle de receta');
      screens.add('Mis recetas favoritas');

      checklist.add('Relacionar recetas con ingredientes');
      checklist.add('Permitir marcar recetas como favoritas');
    }

    if (
      text.includes('venta') ||
      text.includes('ventas') ||
      text.includes('tienda') ||
      text.includes('ecommerce') ||
      text.includes('pago') ||
      text.includes('pagos')
    ) {
      modules.add('Ventas');
      modules.add('Carrito de compras');
      modules.add('Pagos');

      tables.add('orders');
      tables.add('order_items');
      tables.add('payments');

      endpoints.add('POST /orders');
      endpoints.add('GET /orders');
      endpoints.add('POST /payments');

      screens.add('Carrito');
      screens.add('Checkout');
      screens.add('Historial de compras');

      checklist.add('Definir flujo de compra');
      checklist.add('Guardar órdenes con sus productos');
      checklist.add('Definir estados de pago');
    }

    if (
      text.includes('reporte') ||
      text.includes('reportes') ||
      text.includes('pdf') ||
      text.includes('excel') ||
      text.includes('estadistica') ||
      text.includes('estadisticas')
    ) {
      modules.add('Reportes');
      modules.add('Exportación de información');

      endpoints.add('GET /reports/summary');
      endpoints.add('GET /reports/export');

      screens.add('Reportes');
      screens.add('Dashboard de métricas');

      checklist.add('Definir métricas principales del negocio');
      checklist.add('Agregar filtros por fecha');
      checklist.add('Preparar exportación PDF o Excel');
    }

    if (
      text.includes('notificacion') ||
      text.includes('notificaciones') ||
      text.includes('correo') ||
      text.includes('email')
    ) {
      modules.add('Notificaciones');

      tables.add('notifications');

      endpoints.add('GET /notifications');
      endpoints.add('PATCH /notifications/:id/read');

      screens.add('Centro de notificaciones');

      checklist.add('Definir eventos que generan notificaciones');
      checklist.add('Crear contador de notificaciones pendientes');
    }

    if (
      text.includes('chat') ||
      text.includes('mensaje') ||
      text.includes('mensajes') ||
      text.includes('conversacion')
    ) {
      modules.add('Mensajería interna');

      tables.add('messages');

      endpoints.add('GET /messages');
      endpoints.add('POST /messages');

      screens.add('Conversaciones');

      checklist.add('Crear historial de mensajes');
      checklist.add('Definir lectura/no lectura de mensajes');
    }

    if (
      text.includes('app') ||
      text.includes('movil') ||
      text.includes('mobile') ||
      text.includes('android') ||
      text.includes('ios')
    ) {
      modules.add('Aplicación móvil');

      screens.add('Navegación móvil');
      screens.add('Perfil móvil');

      checklist.add('Definir navegación móvil');
      checklist.add('Crear servicios para consumir API desde mobile');
    }

    const moduleCount = modules.size;

    const technicalDifficulty =
      moduleCount <= 5 ? 'Baja' : moduleCount <= 9 ? 'Media' : 'Alta';

    const technicalEstimatedTime =
      technicalDifficulty === 'Baja'
        ? '1 a 2 semanas para prototipo'
        : technicalDifficulty === 'Media'
          ? '3 a 5 semanas para prototipo funcional'
          : '6 a 8 semanas para primera versión estable';

    const platformType =
      text.includes('movil') ||
      text.includes('mobile') ||
      text.includes('android') ||
      text.includes('ios') ||
      text.includes('app')
        ? 'móvil/web'
        : 'web';

    const technicalSummary = `La solicitud parece requerir un sistema ${platformType} con ${Array.from(
      modules,
    )
      .slice(0, 4)
      .join(
        ', ',
      )}. Se recomienda iniciar con un prototipo enfocado en autenticación, panel principal y los módulos centrales del negocio.`;

    const technicalNotes =
      'Este análisis es una primera propuesta generada por reglas internas. Debe validarse con el cliente antes de convertirlo en tareas finales de desarrollo.';

    return {
      technicalSummary,
      technicalDifficulty,
      technicalEstimatedTime,
      technicalSuggestedModules: Array.from(modules),
      technicalSuggestedTables: Array.from(tables),
      technicalSuggestedEndpoints: Array.from(endpoints),
      technicalSuggestedScreens: Array.from(screens),
      technicalChecklist: Array.from(checklist),
      technicalNotes,
    };
  }

  /**
   * Genera y guarda el análisis técnico de una solicitud.
   *
   * Solo lo ejecuta ADMIN desde el controller.
   */
  async generateTechnicalAnalysis(id: number, actorId?: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const analysis = this.buildTechnicalAnalysis({
        projectType: message.projectType,
        budget: message.budget,
        message: message.message,
      });

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          technicalSummary: analysis.technicalSummary,
          technicalDifficulty: analysis.technicalDifficulty,
          technicalEstimatedTime: analysis.technicalEstimatedTime,
          technicalSuggestedModules:
            analysis.technicalSuggestedModules as Prisma.InputJsonValue,
          technicalSuggestedTables:
            analysis.technicalSuggestedTables as Prisma.InputJsonValue,
          technicalSuggestedEndpoints:
            analysis.technicalSuggestedEndpoints as Prisma.InputJsonValue,
          technicalSuggestedScreens:
            analysis.technicalSuggestedScreens as Prisma.InputJsonValue,
          technicalChecklist:
            analysis.technicalChecklist as Prisma.InputJsonValue,
          technicalNotes: analysis.technicalNotes,
          technicalAnalysisAt: new Date(),
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.GENERATE_ANALYSIS,
        module: 'Mensajes',
        description: `Se generó análisis técnico para la solicitud de ${message.name} (${message.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          projectType: message.projectType,
          difficulty: analysis.technicalDifficulty,
          estimatedTime: analysis.technicalEstimatedTime,
        },
      });

      return {
        success: true,
        message: 'Análisis técnico generado correctamente.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al generar análisis técnico:', error);

      throw new InternalServerErrorException(
        'No se pudo generar el análisis técnico.',
      );
    }
  }

  /**
   * Obtiene un mensaje por ID para ADMIN.
   */
  async findOne(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      return {
        success: true,
        message: 'Mensaje obtenido correctamente.',
        data: message,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el mensaje de contacto.',
      );
    }
  }

  /**
   * Actualiza seguimiento del mensaje para ADMIN.
   *
   * - status
   * - priority
   * - adminNotes: solo admin
   * - adminPublicReply: visible para usuario
   */
  async update(
    id: number,
    updateContactMessageDto: UpdateContactMessageDto,
    actorId?: number,
  ) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const hasPublicReply =
        typeof updateContactMessageDto.adminPublicReply === 'string';

      const trimmedPublicReply = hasPublicReply
        ? updateContactMessageDto.adminPublicReply?.trim()
        : undefined;

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          ...(updateContactMessageDto.status
            ? {
                status: updateContactMessageDto.status,
                contactedAt:
                  updateContactMessageDto.status === ContactStatus.CONTACTED
                    ? new Date()
                    : message.contactedAt,
              }
            : {}),

          ...(updateContactMessageDto.priority
            ? {
                priority: updateContactMessageDto.priority,
              }
            : {}),

          ...(typeof updateContactMessageDto.adminNotes === 'string'
            ? {
                adminNotes: updateContactMessageDto.adminNotes.trim() || null,
              }
            : {}),

          ...(hasPublicReply
            ? {
                adminPublicReply: trimmedPublicReply || null,
                adminReplyAt: trimmedPublicReply ? new Date() : null,
              }
            : {}),
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Mensajes',
        description: `Se actualizó el seguimiento de la solicitud de ${updatedMessage.name} (${updatedMessage.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          previousStatus: message.status,
          newStatus: updatedMessage.status,
          previousPriority: message.priority,
          newPriority: updatedMessage.priority,
          publicReplyUpdated: hasPublicReply,
        },
      });

      return {
        success: true,
        message: 'Mensaje actualizado correctamente.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al actualizar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el mensaje de contacto.',
      );
    }
  }

  /**
   * Marca un mensaje como leído.
   */
  async markAsRead(id: number, actorId?: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.MARK_READ,
        module: 'Mensajes',
        description: `Se marcó como leída la solicitud de ${updatedMessage.name} (${updatedMessage.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          previousReadStatus: message.isRead,
          newReadStatus: updatedMessage.isRead,
        },
      });

      return {
        success: true,
        message: 'Mensaje marcado como leído.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al marcar mensaje como leído:', error);

      throw new InternalServerErrorException(
        'No se pudo marcar el mensaje como leído.',
      );
    }
  }

  /**
   * Cuenta mensajes no leídos para ADMIN.
   */
  async countUnread() {
    try {
      const count = await this.prisma.contactMessage.count({
        where: {
          isRead: false,
        },
      });

      return {
        success: true,
        message: 'Mensajes no leídos obtenidos correctamente.',
        data: {
          count,
        },
      };
    } catch (error) {
      console.error('Error al contar mensajes no leídos:', error);

      throw new InternalServerErrorException(
        'No se pudieron contar los mensajes no leídos.',
      );
    }
  }

  /**
   * Elimina un mensaje.
   */
  async remove(id: number, actorId?: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const deletedMessage = await this.prisma.contactMessage.delete({
        where: {
          id,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.DELETE,
        module: 'Mensajes',
        description: `Se eliminó la solicitud de ${deletedMessage.name} (${deletedMessage.email}).`,
        actorId,
        targetId: deletedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          projectType: deletedMessage.projectType,
          status: deletedMessage.status,
          priority: deletedMessage.priority,
        },
      });

      return {
        success: true,
        message: 'Mensaje eliminado correctamente.',
        data: deletedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al eliminar mensaje de contacto:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar el mensaje de contacto.',
      );
    }
  }
}