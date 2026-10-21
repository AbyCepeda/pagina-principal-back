import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createProjectDto: CreateProjectDto, actorId?: number) {
    try {
      const project = await this.prisma.project.create({
        data: {
          title: createProjectDto.title,
          type: createProjectDto.type,
          description: createProjectDto.description,
          image: createProjectDto.image,
          status: createProjectDto.status,
          technologies: createProjectDto.technologies,
          isActive: createProjectDto.isActive ?? true,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.CREATE,
        module: 'Proyectos',
        description: `Se creó el proyecto «${project.title}».`,
        actorId,
        targetId: project.id,
        targetType: 'Project',
        metadata: {
          title: project.title,
          type: project.type,
          isActive: project.isActive,
        },
      });

      return {
        success: true,
        message: 'Proyecto creado correctamente',
        data: project,
      };
    } catch (error) {
      console.error('Error al crear proyecto:', error);

      throw new InternalServerErrorException('No se pudo crear el proyecto.');
    }
  }

  async findAll() {
    try {
      const projects = await this.prisma.project.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Proyectos obtenidos correctamente',
        data: projects,
      };
    } catch (error) {
      console.error('Error al obtener proyectos:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los proyectos.',
      );
    }
  }

  async findPublic() {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Proyectos públicos obtenidos correctamente',
        data: projects,
      };
    } catch (error) {
      console.error('Error al obtener proyectos públicos:', error);

      throw new InternalServerErrorException(
        'No se pudieron obtener los proyectos públicos.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: {
          id,
        },
      });

      if (!project) {
        throw new NotFoundException('Proyecto no encontrado.');
      }

      return {
        success: true,
        message: 'Proyecto obtenido correctamente',
        data: project,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al obtener proyecto:', error);

      throw new InternalServerErrorException('No se pudo obtener el proyecto.');
    }
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
    actorId?: number,
  ) {
    try {
      const project = await this.prisma.project.findUnique({
        where: {
          id,
        },
      });

      if (!project) {
        throw new NotFoundException('Proyecto no encontrado.');
      }

      const updatedProject = await this.prisma.project.update({
        where: {
          id,
        },
        data: {
          ...updateProjectDto,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.UPDATE,
        module: 'Proyectos',
        description: `Se actualizó el proyecto «${updatedProject.title}».`,
        actorId,
        targetId: updatedProject.id,
        targetType: 'Project',
        metadata: {
          title: updatedProject.title,
          changedFields: Object.keys(updateProjectDto),
        },
      });

      return {
        success: true,
        message: 'Proyecto actualizado correctamente',
        data: updatedProject,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al actualizar proyecto:', error);

      throw new InternalServerErrorException(
        'No se pudo actualizar el proyecto.',
      );
    }
  }

  async remove(id: number, actorId?: number) {
    try {
      const project = await this.prisma.project.findUnique({
        where: {
          id,
        },
      });

      if (!project) {
        throw new NotFoundException('Proyecto no encontrado.');
      }

      const deletedProject = await this.prisma.project.delete({
        where: {
          id,
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.DELETE,
        module: 'Proyectos',
        description: `Se eliminó el proyecto «${deletedProject.title}».`,
        actorId,
        targetId: deletedProject.id,
        targetType: 'Project',
        metadata: { title: deletedProject.title },
      });

      return {
        success: true,
        message: 'Proyecto eliminado correctamente',
        data: deletedProject,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al eliminar proyecto:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar el proyecto.',
      );
    }
  }
}
