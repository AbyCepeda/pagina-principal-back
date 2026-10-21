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
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { GetServicesQueryDto } from './dto/get-services-query.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Servicios')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Ruta pública para la landing.
   * Solo muestra servicios activos.
   */
  @ApiEndpoint({
    summary: 'Consultar servicios activos',
    access: 'public',
    status: 200,
  })
  @Get('public')
  findPublic() {
    return this.servicesService.findPublic();
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede ver todos los servicios.
   *
   * Soporta paginación:
   * /services?page=1&limit=10
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('services:read')
  @ApiEndpoint({ summary: 'Listar servicios', access: 'admin', status: 200 })
  @Get()
  findAll(@Query() query: GetServicesQueryDto) {
    return this.servicesService.findAll(query);
  }

  /**
   * Ruta pública para ver un servicio específico.
   */
  @ApiEndpoint({
    summary: 'Consultar un registro de servicios',
    access: 'public',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(Number(id));
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede crear servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('services:create')
  @ApiEndpoint({
    summary: 'Crear un registro de servicios',
    access: 'admin',
    status: 201,
  })
  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.servicesService.create(createServiceDto, user.id);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede editar servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('services:update')
  @ApiEndpoint({
    summary: 'Actualizar un registro de servicios',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.servicesService.update(Number(id), updateServiceDto, user.id);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede eliminar servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('services:delete')
  @ApiEndpoint({
    summary: 'Eliminar un registro de servicios',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.servicesService.remove(Number(id), user.id);
  }
}
