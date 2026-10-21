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
import { CreatePlanDto } from './dto/create-plan.dto';
import { GetPlansQueryDto } from './dto/get-plans-query.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './plans.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';

@ApiTags('Planes')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiEndpoint({
    summary: 'Consultar planes activos',
    access: 'public',
    status: 200,
  })
  @Get('public')
  findPublic() {
    return this.plansService.findPublic();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Crear un registro de planes',
    access: 'admin',
    status: 201,
  })
  @Post()
  create(
    @Body() createPlanDto: CreatePlanDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.plansService.create(createPlanDto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({ summary: 'Listar planes', access: 'admin', status: 200 })
  @Get()
  findAll(@Query() query: GetPlansQueryDto) {
    return this.plansService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Consultar un registro de planes',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Actualizar un registro de planes',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.plansService.update(Number(id), updatePlanDto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiEndpoint({
    summary: 'Eliminar un registro de planes',
    access: 'admin',
    status: 200,
  })
  @ApiNotFoundResponse({ description: 'Registro no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.plansService.remove(Number(id), user.id);
  }
}
