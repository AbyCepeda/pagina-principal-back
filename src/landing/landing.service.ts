import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ContactOptionType } from '@prisma/client'
import { LandingSectionsService } from '../landing-sections/landing-sections.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class LandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly landingSectionsService: LandingSectionsService,
  ) {}

  /**
   * Devuelve toda la información pública que necesita la landing
   * en una sola respuesta.
   */
  async findPublicLandingData() {
    try {
      const [services, projects, projectTypes, budgets, plans, sections] =
        await Promise.all([
          this.getPublicServices(),
          this.getPublicProjects(),
          this.getProjectTypeOptions(),
          this.getBudgetOptions(),
          this.getPublicPlans(),
          this.landingSectionsService.findPublicSections(),
        ])

      return {
        success: true,
        message: 'Landing obtenida correctamente',
        data: {
          services,
          projects,
          projectTypes,
          budgets,
          plans,
          sections,
        },
      }
    } catch (error) {
      console.error('Error al obtener datos públicos de landing:', error)

      throw new InternalServerErrorException(
        'No se pudieron obtener los datos públicos de la landing.',
      )
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
    })
  }

  private async getPublicProjects() {
    return this.prisma.project.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
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
    })
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
    })
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
    })
  }
}