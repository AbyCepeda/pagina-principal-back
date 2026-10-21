import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from '../common/decorators/api-endpoint.decorator';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AnalyzeTechnicalIdeaDto } from './dto/analyze-technical-idea.dto';
import { TechnicalAgentService } from './technical-agent.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@ApiTags('Análisis técnico')
@Controller('technical-agent')
export class TechnicalAgentController {
  constructor(private readonly technicalAgentService: TechnicalAgentService) {}

  @ApiEndpoint({
    summary: 'Analizar una idea de software',
    access: 'admin',
    status: 201,
  })
  @Post('analyze')
  @RequirePermissions('technical-agent:use')
  analyzeIdea(@Body() analyzeTechnicalIdeaDto: AnalyzeTechnicalIdeaDto) {
    return this.technicalAgentService.analyzeIdea(analyzeTechnicalIdeaDto);
  }
}
