import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
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

      throw new InternalServerErrorException('No se pudieron obtener los proyectos.');
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

  async update(id: number, updateProjectDto: UpdateProjectDto) {
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

      throw new InternalServerErrorException('No se pudo actualizar el proyecto.');
    }
  }

  async remove(id: number) {
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

      throw new InternalServerErrorException('No se pudo eliminar el proyecto.');
    }
  }
}