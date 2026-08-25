import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyzeTechnicalIdeaDto } from './dto/analyze-technical-idea.dto';
import { TechnicalAgentService } from './technical-agent.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('technical-agent')
export class TechnicalAgentController {
  constructor(private readonly technicalAgentService: TechnicalAgentService) {}

  @Post('analyze')
  analyzeIdea(@Body() analyzeTechnicalIdeaDto: AnalyzeTechnicalIdeaDto) {
    return this.technicalAgentService.analyzeIdea(analyzeTechnicalIdeaDto);
  }
}