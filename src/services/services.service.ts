import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { GetServicesQueryDto } from './dto/get-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createServiceDto: CreateServiceDto, actorId?: number) {
    try {
      const service = await this.prisma.service.create({
        data: {
          title: createServiceDto.title,
          description: createServiceDto.description,
          icon: createServiceDto.icon,
          isActive: createServiceDto.isActive ?? true,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.CREATE,
        module: 'Servicios',
        description: `Se creó el servicio «${service.title}».`,
        actorId,
        targetId: service.id,
        targetType: 'Service',
        metadata: { title: service.title, isActive: service.isActive },
      });

      return {
        success: true,
        message: 'Servicio creado correctamente',
        data: service,
      };
    } catch (error) {
      console.error('Error al crear servicio:', error);

      throw new InternalServerErrorException('No se pudo crear el servicio.');
    }
  }

  /**
   * Lista servicios para el panel administrativo con paginación.
   *
   * Permite cargar los servicios por partes para evitar traer todos
   * los registros de golpe cuando el catálogo crezca.
   */
  async findAll(query: GetServicesQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const [services, total] = await this.prisma.$transaction([
        this.prisma.service.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.service.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Servicios obtenidos correctamente',
        data: services,
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
      console.error('Error al obtener servicios:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los servicios.',
      );
    }
  }

  async findPublic() {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Servicios públicos obtenidos correctamente',
        data: services,
      };
    } catch (error) {
      console.error('Error al obtener servicios públicos:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los servicios públicos.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const service = await this.prisma.service.findUnique({
        where: {
          id,
        },
      });

      if (!service) {
        throw new NotFoundException('Servicio no encontrado.');
      }

      return {
        success: true,
        message: 'Servicio obtenido correctamente',
        data: service,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener servicio:', error);

      throw new InternalServerErrorException('No se pudo obtener el servicio.');
    }
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
    actorId?: number,
  ) {
    try {
      const service = await this.prisma.service.findUnique({
        where: {
          id,
        },
      });

      if (!service) {
        throw new NotFoundException('Servicio no encontrado.');
      }

      const updatedService = await this.prisma.service.update({
        where: {
          id,
        },
        data: {
          ...updateServiceDto,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Servicios',
        description: `Se actualizó el servicio «${updatedService.title}».`,
        actorId,
        targetId: updatedService.id,
        targetType: 'Service',
        metadata: {
          title: updatedService.title,
          changedFields: Object.keys(updateServiceDto),
        },
      });

      return {
        success: true,
        message: 'Servicio actualizado correctamente',
        data: updatedService,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al actualizar servicio:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el servicio.',
      );
    }
  }

  async remove(id: number, actorId?: number) {
    try {
      const service = await this.prisma.service.findUnique({
        where: {
          id,
        },
      });

      if (!service) {
        throw new NotFoundException('Servicio no encontrado.');
      }

      const deletedService = await this.prisma.service.delete({
        where: {
          id,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.DELETE,
        module: 'Servicios',
        description: `Se eliminó el servicio «${deletedService.title}».`,
        actorId,
        targetId: deletedService.id,
        targetType: 'Service',
        metadata: { title: deletedService.title },
      });

      return {
        success: true,
        message: 'Servicio eliminado correctamente',
        data: deletedService,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al eliminar servicio:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar el servicio.',
      );
    }
  }
}
