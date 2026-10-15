import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyzeTechnicalIdeaDto } from './dto/analyze-technical-idea.dto';
import { estimateEffort } from './effort-estimator';
import { TechnicalAgentService } from './technical-agent.service';

describe('Estimación de esfuerzo y precio', () => {
  it('desglosa trabajo, pruebas y reserva una sola vez', () => {
    const result = estimateEffort(['Contenido público'], {
      hourlyRate: 300,
      hoursPerWeek: 20,
      contingencyPercent: 15,
      externalCosts: 500,
    });
    // Base 24–48 h, pruebas 5–15 h, reserva 5–10 h.
    expect(result.workHours).toEqual({ min: 29, max: 63 });
    expect(result.reserveHours).toEqual({ min: 5, max: 10 });
    expect(result.totalHours).toEqual({ min: 34, max: 73 });
    expect(result.price).toEqual({ min: 10700, max: 22400 });
    expect(result.weeks).toEqual({ min: 2, max: 4 });
  });

  it('no cuenta dos veces agenda y disponibilidad', () => {
    expect(
      estimateEffort(['Agenda y calendario', 'Disponibilidad de horarios'])
        .tasks,
    ).toEqual(estimateEffort(['Agenda y calendario']).tasks);
  });

  it('no cuenta dos veces reportes y exportación', () => {
    expect(
      estimateEffort(['Reportes', 'Exportación de información', 'Reportes'])
        .tasks,
    ).toEqual(estimateEffort(['Reportes']).tasks);
  });

  it('deja precio y calendario pendientes sin tarifa ni capacidad', () => {
    const result = estimateEffort(['Contenido público']);
    expect(result.price).toBeNull();
    expect(result.weeks).toBeNull();
    expect(result.totalHours.min).toBeGreaterThan(0);
  });

  it('no inventa precio si no hay alcance', () => {
    const result = estimateEffort([], {
      hourlyRate: 300,
      hoursPerWeek: 20,
      externalCosts: 200,
    });
    expect(result.status).toBe('needs-scope');
    expect(result.price).toBeNull();
    expect(result.weeks).toBeNull();
    expect(result.tasks).toEqual([]);
  });

  it('requiere revisar funciones sin catálogo', () => {
    const result = estimateEffort(
      ['Contenido público', 'Integración desconocida'],
      { hourlyRate: 300 },
    );
    expect(result.missingModules).toEqual(['Integración desconocida']);
    expect(result.price).toBeNull();
  });

  it('una tarifa distinta cambia el precio pero no las horas', () => {
    const a = estimateEffort(['Pagos'], { hourlyRate: 200 });
    const b = estimateEffort(['Pagos'], { hourlyRate: 400 });
    expect(a.totalHours).toEqual(b.totalHours);
    expect(b.price?.min).toBe(a.price!.min * 2);
    expect(b.price?.max).toBe(a.price!.max * 2);
  });

  it('más disponibilidad cambia el plazo, no el precio', () => {
    const a = estimateEffort(['Aplicación móvil'], {
      hourlyRate: 300,
      hoursPerWeek: 10,
    });
    const b = estimateEffort(['Aplicación móvil'], {
      hourlyRate: 300,
      hoursPerWeek: 40,
    });
    expect(a.price).toEqual(b.price);
    expect(a.weeks!.max).toBeGreaterThan(b.weeks!.max);
  });

  it('permite cero reserva y cero costos externos', () => {
    const result = estimateEffort(['Contenido público'], {
      contingencyPercent: 0,
      externalCosts: 0,
      hourlyRate: 300,
    });
    expect(result.reserveHours).toEqual({ min: 0, max: 0 });
    expect(result.price!.min).toBe(result.workHours.min * 300);
  });

  it('calcula el plazo del planeador a partir de las horas', () => {
    const result = new TechnicalAgentService().analyzeIdea({
      idea: 'Una landing informativa',
      estimation: { hourlyRate: 300, hoursPerWeek: 20 },
    }).data;
    expect(result.effortEstimate.price).not.toBeNull();
    expect(result.technicalEstimatedTime).toBe(
      '2 a 4 semanas según disponibilidad',
    );
  });

  it.each([
    { hourlyRate: -1 },
    { hourlyRate: 0 },
    { hourlyRate: 10001 },
    { hourlyRate: '300' },
    { hoursPerWeek: 0 },
    { hoursPerWeek: 81 },
    { contingencyPercent: -1 },
    { contingencyPercent: 101 },
    { externalCosts: -1 },
    { externalCosts: 1000001 },
    { hourlyRate: 300.123 },
  ])('rechaza configuración inválida: %j', async (estimation) => {
    const input = plainToInstance(AnalyzeTechnicalIdeaDto, {
      idea: 'Landing para un negocio',
      estimation,
    });
    expect(await validate(input)).not.toHaveLength(0);
  });

  it('valida los ajustes opcionales sin exigir nuevos campos a clientes anteriores', async () => {
    expect(
      await validate(
        plainToInstance(AnalyzeTechnicalIdeaDto, {
          idea: 'Landing para un negocio',
        }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(AnalyzeTechnicalIdeaDto, {
          idea: 'Landing para un negocio',
          estimation: {
            hourlyRate: 300,
            hoursPerWeek: 20,
            contingencyPercent: 15,
            externalCosts: 0,
          },
        }),
      ),
    ).toHaveLength(0);
  });
});
