import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { GetContactOptionsQueryDto } from './dto/get-contact-options-query.dto';
import { UpdateContactOptionDto } from './dto/update-contact-option.dto';
import { CreateContactOptionDto } from './dto/create-contact-option.dto';

@Injectable()
export class ContactOptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Crea una opción para los selects del formulario de contacto.
   *
   * Si no se envía sortOrder, se asigna automáticamente
   * el siguiente orden disponible dentro del mismo tipo.
   */
  async create(
    createContactOptionDto: CreateContactOptionDto,
    actorId?: number,
  ) {
    const lastOption = await this.prisma.contactOption.findFirst({
      where: {
        type: createContactOptionDto.type,
      },
      orderBy: {
        sortOrder: 'desc',
      },
    });

    const nextSortOrder = (lastOption?.sortOrder ?? 0) + 1;

    const option = await this.prisma.contactOption.create({
      data: {
        type: createContactOptionDto.type,
        label: createContactOptionDto.label.trim(),
        value: createContactOptionDto.value.trim(),
        sortOrder: createContactOptionDto.sortOrder ?? nextSortOrder,
        isActive: createContactOptionDto.isActive ?? true,
      },
    });

    await this.auditLogService.createLog({
      action: AuditLogAction.CREATE,
      module: 'Landing',
      description: `Se creó la opción de contacto «${option.label}».`,
      actorId,
      targetId: option.id,
      targetType: 'ContactOption',
      metadata: {
        label: option.label,
        type: option.type,
        isActive: option.isActive,
      },
    });

    return {
      success: true,
      message: 'Opción creada correctamente',
      data: option,
    };
  }

  /**
   * Lista opciones.
   *
   * En admin puede consultar activas e inactivas.
   */
  /**
   * Lista opciones para admin con filtros y paginación.
   *
   * Permite:
   * - Filtrar por tipo
   * - Filtrar activas/inactivas
   * - Traer datos por página para no cargar todo de golpe
   */
  async findAll(query: GetContactOptionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactOptionWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(typeof query.isActive === 'boolean'
        ? { isActive: query.isActive }
        : {}),
    };

    const [options, total] = await this.prisma.$transaction([
      this.prisma.contactOption.findMany({
        where,
        orderBy: [
          {
            type: 'asc',
          },
          {
            sortOrder: 'asc',
          },
          {
            label: 'asc',
          },
        ],
        skip,
        take: limit,
      }),

      this.prisma.contactOption.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Opciones obtenidas correctamente',
      data: options,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Lista opciones públicas activas.
   *
   * Esta ruta la usará la landing para llenar los selects.
   */
  async findPublic(query: GetContactOptionsQueryDto) {
    const where: Prisma.ContactOptionWhereInput = {
      isActive: true,
      ...(query.type ? { type: query.type } : {}),
    };

    const options = await this.prisma.contactOption.findMany({
      where,
      orderBy: [
        {
          type: 'asc',
        },
        {
          sortOrder: 'asc',
        },
        {
          label: 'asc',
        },
      ],
    });

    return {
      success: true,
      message: 'Opciones públicas obtenidas correctamente',
      data: options,
    };
  }

  /**
   * Busca una opción por id.
   */
  async findOne(id: number) {
    const option = await this.prisma.contactOption.findUnique({
      where: {
        id,
      },
    });

    if (!option) {
      throw new NotFoundException('Opción no encontrada.');
    }

    return {
      success: true,
      message: 'Opción obtenida correctamente',
      data: option,
    };
  }

  /**
   * Actualiza una opción.
   */
  async update(
    id: number,
    updateContactOptionDto: UpdateContactOptionDto,
    actorId?: number,
  ) {
    const option = await this.prisma.contactOption.findUnique({
      where: {
        id,
      },
    });

    if (!option) {
      throw new NotFoundException('Opción no encontrada.');
    }

    if (
      updateContactOptionDto.label !== undefined &&
      !updateContactOptionDto.label.trim()
    ) {
      throw new BadRequestException('La etiqueta no puede estar vacía.');
    }

    if (
      updateContactOptionDto.value !== undefined &&
      !updateContactOptionDto.value.trim()
    ) {
      throw new BadRequestException('El valor no puede estar vacío.');
    }

    const updatedOption = await this.prisma.contactOption.update({
      where: {
        id,
      },
      data: {
        ...(updateContactOptionDto.type !== undefined
          ? { type: updateContactOptionDto.type }
          : {}),
        ...(updateContactOptionDto.label !== undefined
          ? { label: updateContactOptionDto.label.trim() }
          : {}),
        ...(updateContactOptionDto.value !== undefined
          ? { value: updateContactOptionDto.value.trim() }
          : {}),
        ...(updateContactOptionDto.sortOrder !== undefined
          ? { sortOrder: updateContactOptionDto.sortOrder }
          : {}),
        ...(updateContactOptionDto.isActive !== undefined
          ? { isActive: updateContactOptionDto.isActive }
          : {}),
      },
    });

    await this.auditLogService.createLog({
      action: AuditLogAction.UPDATE,
      module: 'Landing',
      description: `Se actualizó la opción de contacto «${updatedOption.label}».`,
      actorId,
      targetId: updatedOption.id,
      targetType: 'ContactOption',
      metadata: {
        label: updatedOption.label,
        changedFields: Object.keys(updateContactOptionDto),
      },
    });

    return {
      success: true,
      message: 'Opción actualizada correctamente',
      data: updatedOption,
    };
  }

  /**
   * Elimina una opción.
   *
   * Para uso normal es mejor desactivar,
   * pero dejamos delete disponible para admin.
   */
  async remove(id: number, actorId?: number) {
    const option = await this.prisma.contactOption.findUnique({
      where: {
        id,
      },
    });

    if (!option) {
      throw new NotFoundException('Opción no encontrada.');
    }

    await this.prisma.contactOption.delete({
      where: {
        id,
      },
    });

    await this.auditLogService.createLog({
      action: AuditLogAction.DELETE,
      module: 'Landing',
      description: `Se eliminó la opción de contacto «${option.label}».`,
      actorId,
      targetId: option.id,
      targetType: 'ContactOption',
      metadata: { label: option.label, type: option.type },
    });

    return {
      success: true,
      message: 'Opción eliminada correctamente',
      data: option,
    };
  }
}
