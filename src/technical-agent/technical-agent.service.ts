import { Injectable } from '@nestjs/common';
import { AnalyzeTechnicalIdeaDto } from './dto/analyze-technical-idea.dto';
import { buildTechnicalAnalysis } from './technical-analysis.rules';

@Injectable()
export class TechnicalAgentService {
  analyzeIdea(analyzeTechnicalIdeaDto: AnalyzeTechnicalIdeaDto) {
    const analysis = buildTechnicalAnalysis({
      projectType: analyzeTechnicalIdeaDto.projectType?.trim() || 'Idea libre',
      budget:
        analyzeTechnicalIdeaDto.budget?.trim() || 'Presupuesto no definido',
      message: analyzeTechnicalIdeaDto.idea.trim(),
    });

    return {
      success: true,
      message: 'Análisis técnico generado correctamente.',
      data: analysis,
    };
  }
}
