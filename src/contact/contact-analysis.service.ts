import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogAction } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildTechnicalAnalysis } from './technical-analysis.rules';

@Injectable()
export class ContactAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Genera y guarda el análisis técnico de una solicitud.
   *
   * Solo lo ejecuta ADMIN desde el controller.
   */
  async generateTechnicalAnalysis(id: number, actorId?: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: {
          id,
        },
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado.');
      }

      const analysis = buildTechnicalAnalysis({
        projectType: message.projectType,
        budget: message.budget,
        message: message.message,
      });

      const updatedMessage = await this.prisma.contactMessage.update({
        where: {
          id,
        },
        data: {
          technicalSummary: analysis.technicalSummary,
          technicalDifficulty: analysis.technicalDifficulty,
          technicalEstimatedTime: analysis.technicalEstimatedTime,
          technicalSuggestedModules: analysis.technicalSuggestedModules,
          technicalSuggestedTables: analysis.technicalSuggestedTables,
          technicalSuggestedEndpoints: analysis.technicalSuggestedEndpoints,
          technicalSuggestedScreens: analysis.technicalSuggestedScreens,
          technicalChecklist: analysis.technicalChecklist,
          technicalNotes: analysis.technicalNotes,
          technicalAnalysisAt: new Date(),
        },
      });

      await this.auditLogService.createLog({
        action: AuditLogAction.GENERATE_ANALYSIS,
        module: 'Mensajes',
        description: `Se generó análisis técnico para la solicitud de ${message.name} (${message.email}).`,
        actorId,
        targetId: updatedMessage.id,
        targetType: 'ContactMessage',
        metadata: {
          projectType: message.projectType,
          difficulty: analysis.technicalDifficulty,
          estimatedTime: analysis.technicalEstimatedTime,
        },
      });

      return {
        success: true,
        message: 'Análisis técnico generado correctamente.',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Error al generar análisis técnico:', error);

      throw new InternalServerErrorException(
        'No se pudo generar el análisis técnico.',
      );
    }
  }
}
