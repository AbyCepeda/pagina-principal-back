import { Injectable } from '@nestjs/common';
import { ContactPriority, ContactStatus } from '@prisma/client';

type LeadAgentInput = {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
};

type LeadAgentAnalysis = {
  status: ContactStatus;
  priority: ContactPriority;
  score: number;
  tags: string[];
  summary: string;
  suggestedAction: string;
  suggestedReply: string;
};

@Injectable()
export class LeadAgentService {
  /**
   * Analiza un lead usando reglas simples.
   *
   * No usa IA externa. Solo evalúa:
   * - presupuesto
   * - tipo de proyecto
   * - palabras clave del mensaje
   * - nivel de detalle del mensaje
   */
  analyzeLead(input: LeadAgentInput): LeadAgentAnalysis {
    let score = 0;
    const tags: string[] = [];

    const projectType = input.projectType.trim().toLowerCase();
    const budget = input.budget.trim().toLowerCase();
    const message = input.message.trim().toLowerCase();

    /**
     * Reglas por presupuesto.
     */
    if (
      budget.includes('40,000') ||
      budget.includes('40000') ||
      budget.includes('más de') ||
      budget.includes('mas de')
    ) {
      score += 30;
      tags.push('presupuesto alto');
    }

    if (
      budget.includes('20,000') ||
      budget.includes('20000') ||
      budget.includes('10,000') ||
      budget.includes('10000')
    ) {
      score += 15;
      tags.push('presupuesto medio');
    }

    if (
      budget.includes('menos') ||
      budget.includes('5,000') ||
      budget.includes('5000')
    ) {
      score += 5;
      tags.push('presupuesto bajo');
    }

    if (budget.includes('no lo sé') || budget.includes('no lo se')) {
      score += 5;
      tags.push('presupuesto por definir');
    }

    /**
     * Reglas por tipo de proyecto.
     */
    if (projectType.includes('app') || projectType.includes('móvil')) {
      score += 20;
      tags.push('app móvil');
    }

    if (
      projectType.includes('sistema') ||
      projectType.includes('administrativo')
    ) {
      score += 20;
      tags.push('sistema administrativo');
    }

    if (
      projectType.includes('tienda') ||
      projectType.includes('ecommerce') ||
      projectType.includes('en línea')
    ) {
      score += 15;
      tags.push('tienda en línea');
    }

    if (projectType.includes('landing')) {
      score += 10;
      tags.push('landing page');
    }

    if (projectType.includes('mantenimiento') || projectType.includes('mejora')) {
      score += 10;
      tags.push('mantenimiento');
    }

    /**
     * Reglas por urgencia.
     */
    if (
      message.includes('urgente') ||
      message.includes('urge') ||
      message.includes('rápido') ||
      message.includes('rapido') ||
      message.includes('lo antes posible')
    ) {
      score += 30;
      tags.push('urgente');
    }

    if (
      message.includes('este mes') ||
      message.includes('esta semana') ||
      message.includes('mañana') ||
      message.includes('manana') ||
      message.includes('fecha límite') ||
      message.includes('fecha limite')
    ) {
      score += 20;
      tags.push('fecha cercana');
    }

    /**
     * Reglas por intención comercial.
     */
    if (
      message.includes('cotización') ||
      message.includes('cotizacion') ||
      message.includes('presupuesto') ||
      message.includes('precio') ||
      message.includes('costo')
    ) {
      score += 10;
      tags.push('solicita cotización');
    }

    if (
      message.includes('empresa') ||
      message.includes('negocio') ||
      message.includes('clientes') ||
      message.includes('ventas')
    ) {
      score += 10;
      tags.push('negocio activo');
    }

    /**
     * Regla por mensaje detallado.
     */
    if (message.length >= 120) {
      score += 10;
      tags.push('mensaje detallado');
    }

    const normalizedScore = Math.min(score, 100);

    const priority = this.getPriorityByScore(normalizedScore);
    const status = this.getStatusByPriority(priority);

    return {
      status,
      priority,
      score: normalizedScore,
      tags: this.removeDuplicateTags(tags),
      summary: this.buildSummary(input, normalizedScore),
      suggestedAction: this.buildSuggestedAction(priority, projectType),
      suggestedReply: this.buildSuggestedReply(input, priority),
    };
  }

  /**
   * Convierte el score en prioridad.
   */
  private getPriorityByScore(score: number): ContactPriority {
    if (score >= 70) return ContactPriority.HIGH;
    if (score >= 40) return ContactPriority.NORMAL;

    return ContactPriority.LOW;
  }

  /**
   * Define el estado inicial recomendado.
   */
  private getStatusByPriority(priority: ContactPriority): ContactStatus {
    if (priority === ContactPriority.HIGH) {
      return ContactStatus.REVIEWING;
    }

    return ContactStatus.NEW;
  }

  /**
   * Elimina etiquetas repetidas.
   */
  private removeDuplicateTags(tags: string[]) {
    return Array.from(new Set(tags));
  }

  /**
   * Genera un resumen simple del lead.
   */
  private buildSummary(input: LeadAgentInput, score: number) {
    return `Lead de ${input.name} interesado en "${input.projectType}" con presupuesto "${input.budget}". Score automático: ${score}/100.`;
  }

  /**
   * Genera una acción recomendada para el admin.
   */
  private buildSuggestedAction(
    priority: ContactPriority,
    projectType: string,
  ) {
    if (priority === ContactPriority.HIGH) {
      return 'Contactar en menos de 24 horas. Pedir alcance del proyecto, fecha objetivo, presupuesto confirmado y funcionalidades principales.';
    }

    if (
      projectType.includes('app') ||
      projectType.includes('móvil') ||
      projectType.includes('sistema')
    ) {
      return 'Contactar para levantar requerimientos. Preguntar por usuarios, módulos, roles, flujos principales y fecha estimada.';
    }

    return 'Responder al cliente para confirmar detalles básicos del proyecto y agendar una breve llamada o conversación.';
  }

  /**
   * Genera una respuesta sugerida para el cliente.
   */
  private buildSuggestedReply(
    input: LeadAgentInput,
    priority: ContactPriority,
  ) {
    const greeting = `Hola ${input.name}, gracias por contactarme.`;

    if (priority === ContactPriority.HIGH) {
      return `${greeting} Claro, puedo ayudarte con tu proyecto de ${input.projectType}. Para darte una propuesta más precisa, ¿podrías compartirme qué funcionalidades necesitas, cuál es tu fecha objetivo y si ya tienes contenido, imágenes o referencias visuales?`;
    }

    return `${greeting} Con gusto puedo revisar tu proyecto de ${input.projectType}. Para orientarte mejor, ¿podrías compartirme un poco más sobre lo que necesitas, el objetivo del proyecto y cuándo te gustaría tenerlo listo?`;
  }
}