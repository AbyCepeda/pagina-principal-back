import { ApiTags, ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Proyectos')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Ruta pública para la landing.
   * Solo muestra proyectos activos.
   */
  @ApiEndpoint({
    summary: 'Consultar proyectos activos',
    access: 'public',
    status: 200,
  })
  @Get('public')
  findPublic() {
    return this.projectsService.findPublic();
  }

  /**
   * Ruta pública para obtener un proyecto.
   */
  @ApiEndpoint({
    summary: 'Consultar un registro de proyectos',
    access: 'public',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(Number(id));
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede ver todos los proyectos, activos e inactivos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({ summary: 'Listar proyectos', access: 'admin', status: 200 })
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede crear proyectos.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Crear un registro de proyectos',
    access: 'admin',
    status: 201,
  })
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
  @ApiEndpoint({
    summary: 'Actualizar un registro de proyectos',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
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
  @ApiEndpoint({
    summary: 'Eliminar un registro de proyectos',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(Number(id));
  }
}
