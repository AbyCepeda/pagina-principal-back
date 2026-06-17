import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContactOptionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LandingData = {
  services: Awaited<ReturnType<LandingService['getPublicServices']>>;
  projects: Awaited<ReturnType<LandingService['getPublicProjects']>>;
  projectTypes: Awaited<ReturnType<LandingService['getProjectTypeOptions']>>;
  budgets: Awaited<ReturnType<LandingService['getBudgetOptions']>>;
  plans: Awaited<ReturnType<LandingService['getPublicPlans']>>;
};

@Injectable()
export class LandingService {
  private cachedData: LandingData | null = null;
  private cachedAt = 0;

  /**
   * Tiempo de vida del cache en milisegundos.
   * 5 minutos reduce consultas a la BD sin dejar datos viejos demasiado tiempo.
   */
  private readonly cacheTtl = 1000 * 60 * 5;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Devuelve toda la información pública que necesita la landing
   * en una sola respuesta.
   */
  async findPublicLandingData() {
    try {
      const now = Date.now();
      const isCacheValid =
        this.cachedData !== null && now - this.cachedAt < this.cacheTtl;

      if (isCacheValid) {
        return {
          success: true,
          message: 'Landing obtenida desde cache',
          data: this.cachedData,
        };
      }

      const [services, projects, projectTypes, budgets, plans] =
        await this.prisma.$transaction([
          this.prisma.service.findMany({
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),

          this.prisma.project.findMany({
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),

          this.prisma.contactOption.findMany({
            where: {
              isActive: true,
              type: ContactOptionType.PROJECT_TYPE,
            },
            orderBy: [
              {
                sortOrder: 'asc',
              },
              {
                label: 'asc',
              },
            ],
          }),

          this.prisma.contactOption.findMany({
            where: {
              isActive: true,
              type: ContactOptionType.BUDGET,
            },
            orderBy: [
              {
                sortOrder: 'asc',
              },
              {
                label: 'asc',
              },
            ],
          }),

          this.prisma.plan.findMany({
            where: {
              isActive: true,
            },
            orderBy: [
              {
                sortOrder: 'asc',
              },
              {
                createdAt: 'desc',
              },
            ],
          }),
        ]);

      this.cachedData = {
        services,
        projects,
        projectTypes,
        budgets,
        plans,
      };

      this.cachedAt = now;

      return {
        success: true,
        message: 'Landing obtenida correctamente',
        data: this.cachedData,
      };
    } catch (error) {
      console.error('Error al obtener datos públicos de landing:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los datos públicos de la landing.',
      );
    }
  }

  private async getPublicServices() {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getPublicProjects() {
    return this.prisma.project.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getProjectTypeOptions() {
    return this.prisma.contactOption.findMany({
      where: {
        isActive: true,
        type: ContactOptionType.PROJECT_TYPE,
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

  private async getBudgetOptions() {
    return this.prisma.contactOption.findMany({
      where: {
        isActive: true,
        type: ContactOptionType.BUDGET,
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

  private async getPublicPlans() {
    return this.prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }
}