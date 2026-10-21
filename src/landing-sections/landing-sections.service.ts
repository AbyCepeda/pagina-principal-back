import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { defaultLandingSections } from './landing-section.defaults';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '@prisma/client';

@Injectable()
export class LandingSectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async ensureDefaultSections() {
    try {
      await Promise.all(
        defaultLandingSections.map((section) =>
          this.prisma.landingSection.upsert({
            where: {
              key: section.key,
            },
            update: {
              label: section.label,
              href: section.href,
              sortOrder: section.sortOrder,
            },
            create: section,
          }),
        ),
      );
    } catch (error) {
      console.error('Error al crear secciones por defecto:', error);

      throw new InternalServerErrorException(
        'No se pudieron crear las secciones por defecto.',
      );
    }
  }

  async findAll() {
    try {
      await this.ensureDefaultSections();

      const sections = await this.prisma.landingSection.findMany({
        orderBy: [
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
        message: 'Secciones obtenidas correctamente.',
        data: sections,
      };
    } catch (error) {
      console.error('Error al obtener secciones:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener las secciones de la landing.',
      );
    }
  }

  async findPublicSections() {
    await this.ensureDefaultSections();

    return this.prisma.landingSection.findMany({
      where: {
        isVisible: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          label: 'asc',
        },
      ],
    });
  }

  async update(
    key: string,
    updateLandingSectionDto: UpdateLandingSectionDto,
    actorId?: number,
  ) {
    try {
      const section = await this.prisma.landingSection.findUnique({
        where: {
          key,
        },
      });

      if (!section) {
        throw new NotFoundException('La sección no existe.');
      }

      const updatedSection = await this.prisma.landingSection.update({
        where: {
          key,
        },
        data: {
          ...(typeof updateLandingSectionDto.label === 'string'
            ? {
                label: updateLandingSectionDto.label.trim(),
              }
            : {}),

          ...(typeof updateLandingSectionDto.href === 'string'
            ? {
                href: updateLandingSectionDto.href.trim(),
              }
            : {}),

          ...(typeof updateLandingSectionDto.sortOrder === 'number'
            ? {
                sortOrder: updateLandingSectionDto.sortOrder,
              }
            : {}),

          ...(typeof updateLandingSectionDto.isVisible === 'boolean'
            ? {
                isVisible: updateLandingSectionDto.isVisible,
              }
            : {}),
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Landing',
        description: `Se actualizó la sección «${updatedSection.label}».`,
        actorId,
        targetType: 'LandingSection',
        metadata: {
          key: updatedSection.key,
          changedFields: Object.keys(updateLandingSectionDto),
        },
      });

      return {
        success: true,
        message: 'Sección actualizada correctamente.',
        data: updatedSection,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al actualizar sección:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar la sección.',
      );
    }
  }
}
