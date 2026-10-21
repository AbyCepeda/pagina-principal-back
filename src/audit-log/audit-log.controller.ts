import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditLogService } from './audit-log.service';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@ApiTags('Auditoría')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiEndpoint({
    summary: 'Consultar el historial de auditoría',
    access: 'admin',
    status: 200,
  })
  @Get()
  @RequirePermissions('activity:read')
  findAll(@Query() query: GetAuditLogsQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
