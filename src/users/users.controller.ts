import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProjectsService } from './users.service';
import { GetProjectsQueryDto } from './dto/get-users-query.dto';
import { CreateProjectDto } from 'src/projects/dto/create-project.dto';
import { UpdateProjectDto } from 'src/projects/dto/update-project.dto';


@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Ruta pública para la landing.
   * Solo muestra proyectos activos.
   */
  @Get('public')
  findPublic() {
    return this.projectsService.findPublic();
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede ver todos los proyectos, activos e inactivos.
   *
   * Soporta paginación:
   * /projects?page=1&limit=10
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: GetProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  /**
   * Ruta pública para obtener un proyecto.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(Number(id));
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede crear proyectos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede editar proyectos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(Number(id), updateProjectDto);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede eliminar proyectos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(Number(id));
  }
}