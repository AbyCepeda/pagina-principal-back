import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContactPriority, ContactStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene métricas generales para el panel admin.
   *
   * Se usa una sola petición desde el frontend para mostrar:
   * usuarios, contactos/leads, proyectos, servicios y últimos mensajes.
   */
  async getSummary() {
    try {
      const [
        usersByRole,
        totalContacts,
        unreadContacts,
        contactsByStatus,
        contactsByPriority,
        projectsByStatus,
        servicesByStatus,
        latestContacts,
      ] = await Promise.all([
        this.prisma.user.groupBy({
          by: ['role'],
          _count: {
            id: true,
          },
        }),

        this.prisma.contactMessage.count(),

        this.prisma.contactMessage.count({
          where: {
            isRead: false,
          },
        }),

        this.prisma.contactMessage.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
        }),

        this.prisma.contactMessage.groupBy({
          by: ['priority'],
          _count: {
            id: true,
          },
        }),

        this.prisma.project.groupBy({
          by: ['isActive'],
          _count: {
            id: true,
          },
        }),

        this.prisma.service.groupBy({
          by: ['isActive'],
          _count: {
            id: true,
          },
        }),

        this.prisma.contactMessage.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            projectType: true,
            budget: true,
            isRead: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        }),
      ]);

      const totalUsers = this.getRoleCount(usersByRole, Role.ADMIN) +
        this.getRoleCount(usersByRole, Role.USER);

      const totalAdmins = this.getRoleCount(usersByRole, Role.ADMIN);
      const totalNormalUsers = this.getRoleCount(usersByRole, Role.USER);

      const newContacts = this.getStatusCount(contactsByStatus, ContactStatus.NEW);
      const reviewingContacts = this.getStatusCount(
        contactsByStatus,
        ContactStatus.REVIEWING,
      );
      const contactedContacts = this.getStatusCount(
        contactsByStatus,
        ContactStatus.CONTACTED,
      );
      const closedContacts = this.getStatusCount(
        contactsByStatus,
        ContactStatus.CLOSED,
      );

      const highPriorityContacts = this.getPriorityCount(
        contactsByPriority,
        ContactPriority.HIGH,
      );

      const activeProjects = this.getBooleanCount(projectsByStatus, true);
      const inactiveProjects = this.getBooleanCount(projectsByStatus, false);

      const activeServices = this.getBooleanCount(servicesByStatus, true);
      const inactiveServices = this.getBooleanCount(servicesByStatus, false);

      return {
        success: true,
        message: 'Resumen del dashboard obtenido correctamente',
        data: {
          users: {
            total: totalUsers,
            admins: totalAdmins,
            normalUsers: totalNormalUsers,
          },
          contacts: {
            total: totalContacts,
            unread: unreadContacts,
            read: totalContacts - unreadContacts,
            new: newContacts,
            reviewing: reviewingContacts,
            contacted: contactedContacts,
            closed: closedContacts,
            highPriority: highPriorityContacts,
          },
          projects: {
            total: activeProjects + inactiveProjects,
            active: activeProjects,
            inactive: inactiveProjects,
          },
          services: {
            total: activeServices + inactiveServices,
            active: activeServices,
            inactive: inactiveServices,
          },
          latestContacts,
        },
      };
    } catch (error) {
      console.error('Error al obtener resumen del dashboard:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el resumen del dashboard.',
      );
    }
  }

  private getRoleCount(
    groupedData: { role: Role; _count: { id: number } }[],
    role: Role,
  ) {
    return groupedData.find((item) => item.role === role)?._count.id ?? 0;
  }

  private getStatusCount(
    groupedData: { status: ContactStatus; _count: { id: number } }[],
    status: ContactStatus,
  ) {
    return groupedData.find((item) => item.status === status)?._count.id ?? 0;
  }

  private getPriorityCount(
    groupedData: { priority: ContactPriority; _count: { id: number } }[],
    priority: ContactPriority,
  ) {
    return groupedData.find((item) => item.priority === priority)?._count.id ?? 0;
  }

  private getBooleanCount(
    groupedData: { isActive: boolean; _count: { id: number } }[],
    isActive: boolean,
  ) {
    return groupedData.find((item) => item.isActive === isActive)?._count.id ?? 0;
  }
}