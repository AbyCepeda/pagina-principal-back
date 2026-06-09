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

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Ruta pública para la landing.
   * Solo muestra servicios activos.
   */
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: GetServicesQueryDto) {
    return this.servicesService.findAll(query);
  }

  /**
   * Ruta pública para ver un servicio específico.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(Number(id));
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede crear servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede editar servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(Number(id), updateServiceDto);
  }

  /**
   * Ruta privada.
   * Solo ADMIN puede eliminar servicios.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(Number(id));
  }
}