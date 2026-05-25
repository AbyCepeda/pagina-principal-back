import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    try {
      const [
        totalUsers,
        totalAdmins,
        totalNormalUsers,
        totalContacts,
        unreadContacts,
        totalProjects,
        activeProjects,
        totalServices,
        activeServices,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            role: Role.ADMIN,
          },
        }),
        this.prisma.user.count({
          where: {
            role: Role.USER,
          },
        }),
        this.prisma.contactMessage.count(),
        this.prisma.contactMessage.count({
          where: {
            isRead: false,
          },
        }),
        this.prisma.project.count(),
        this.prisma.project.count({
          where: {
            isActive: true,
          },
        }),
        this.prisma.service.count(),
        this.prisma.service.count({
          where: {
            isActive: true,
          },
        }),
      ]);

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
          },
          projects: {
            total: totalProjects,
            active: activeProjects,
            inactive: totalProjects - activeProjects,
          },
          services: {
            total: totalServices,
            active: activeServices,
            inactive: totalServices - activeServices,
          },
        },
      };
    } catch (error) {
      console.error('Error al obtener resumen del dashboard:', error);

      throw new InternalServerErrorException(
        'No se pudo obtener el resumen del dashboard.',
      );
    }
  }
}