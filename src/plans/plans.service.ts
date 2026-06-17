import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un paquete nuevo.
   *
   * El slug sirve como identificador único estable.
   * Ejemplo: landing-basica, pagina-profesional.
   */
  async create(createPlanDto: CreatePlanDto) {
    try {
      const slug = createPlanDto.slug.trim().toLowerCase();

      const existingPlan = await this.prisma.plan.findUnique({
        where: {
          slug,
        },
      });

      if (existingPlan) {
        throw new ConflictException('Ya existe un paquete con ese slug.');
      }

      const plan = await this.prisma.plan.create({
        data: {
          slug,
          name: createPlanDto.name.trim(),
          subtitle: createPlanDto.subtitle.trim(),
          description: createPlanDto.description.trim(),
          idealFor: createPlanDto.idealFor.trim(),
          features: createPlanDto.features.map((feature) => feature.trim()),
          cta: createPlanDto.cta.trim(),
          highlight: createPlanDto.highlight ?? false,
          isActive: createPlanDto.isActive ?? true,
          sortOrder: createPlanDto.sortOrder ?? 0,
        },
      });

      return {
        success: true,
        message: 'Paquete creado correctamente',
        data: plan,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      console.error('Error al crear paquete:', error);

      throw new InternalServerErrorException('No se pudo crear el paquete.');
    }
  }

  /**
   * Lista paquetes para el panel admin.
   *
   * Permite paginación y filtro por estado activo/inactivo.
   */
  async findAll(query: GetPlansQueryDto) {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;

      const where: Prisma.PlanWhereInput = {
        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
      };

      const [plans, total] = await this.prisma.$transaction([
        this.prisma.plan.findMany({
          where,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        this.prisma.plan.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Paquetes obtenidos correctamente',
        data: plans,
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
      console.error('Error al obtener paquetes:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los paquetes.',
      );
    }
  }

  /**
   * Lista paquetes públicos activos para la landing.
   */
  async findPublic() {
    try {
      const plans = await this.prisma.plan.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });

      return {
        success: true,
        message: 'Paquetes públicos obtenidos correctamente',
        data: plans,
      };
    } catch (error) {
      console.error('Error al obtener paquetes públicos:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los paquetes públicos.',
      );
    }
  }

  /**
   * Busca un paquete por id.
   */
  async findOne(id: number) {
    try {
      if (!Number.isInteger(id)) {
        throw new BadRequestException('Id inválido.');
      }

      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundException('Paquete no encontrado.');
      }

      return {
        success: true,
        message: 'Paquete obtenido correctamente',
        data: plan,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error al obtener paquete:', error);

      throw new InternalServerErrorException('No se pudo obtener el paquete.');
    }
  }

  /**
   * Actualiza un paquete.
   *
   * También permite actualizar el slug, validando que no se repita
   * con otro paquete existente.
   */
  async update(id: number, updatePlanDto: UpdatePlanDto) {
    try {
      if (!Number.isInteger(id)) {
        throw new BadRequestException('Id inválido.');
      }

      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundException('Paquete no encontrado.');
      }

      if (typeof updatePlanDto.slug === 'string') {
        const newSlug = updatePlanDto.slug.trim().toLowerCase();

        const existingPlanWithSlug = await this.prisma.plan.findUnique({
          where: {
            slug: newSlug,
          },
        });

        if (existingPlanWithSlug && existingPlanWithSlug.id !== id) {
          throw new ConflictException('Ya existe otro paquete con ese slug.');
        }
      }

      const updatedPlan = await this.prisma.plan.update({
        where: { id },
        data: {
          ...(typeof updatePlanDto.slug === 'string'
            ? { slug: updatePlanDto.slug.trim().toLowerCase() }
            : {}),
          ...(typeof updatePlanDto.name === 'string'
            ? { name: updatePlanDto.name.trim() }
            : {}),
          ...(typeof updatePlanDto.subtitle === 'string'
            ? { subtitle: updatePlanDto.subtitle.trim() }
            : {}),
          ...(typeof updatePlanDto.description === 'string'
            ? { description: updatePlanDto.description.trim() }
            : {}),
          ...(typeof updatePlanDto.idealFor === 'string'
            ? { idealFor: updatePlanDto.idealFor.trim() }
            : {}),
          ...(Array.isArray(updatePlanDto.features)
            ? {
                features: updatePlanDto.features.map((feature) =>
                  feature.trim(),
                ),
              }
            : {}),
          ...(typeof updatePlanDto.cta === 'string'
            ? { cta: updatePlanDto.cta.trim() }
            : {}),
          ...(typeof updatePlanDto.highlight === 'boolean'
            ? { highlight: updatePlanDto.highlight }
            : {}),
          ...(typeof updatePlanDto.isActive === 'boolean'
            ? { isActive: updatePlanDto.isActive }
            : {}),
          ...(typeof updatePlanDto.sortOrder === 'number'
            ? { sortOrder: updatePlanDto.sortOrder }
            : {}),
        },
      });

      return {
        success: true,
        message: 'Paquete actualizado correctamente',
        data: updatedPlan,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error al actualizar paquete:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el paquete.',
      );
    }
  }

  /**
   * Elimina un paquete.
   */
  async remove(id: number) {
    try {
      if (!Number.isInteger(id)) {
        throw new BadRequestException('Id inválido.');
      }

      const plan = await this.prisma.plan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundException('Paquete no encontrado.');
      }

      await this.prisma.plan.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Paquete eliminado correctamente',
        data: plan,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error al eliminar paquete:', error);

      throw new InternalServerErrorException('No se pudo eliminar el paquete.');
    }
  }
}