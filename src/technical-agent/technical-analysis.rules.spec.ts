import { buildTechnicalAnalysis } from './technical-analysis.rules';
import { buildTechnicalAnalysis as analyzeContact } from '../contact/technical-analysis.rules';
import { TechnicalAgentService } from './technical-agent.service';

const analyze = (message: string, projectType = 'Idea libre', budget = '') =>
  buildTechnicalAnalysis({ message, projectType, budget });

describe('Análisis técnico compartido', () => {
  it('no agrega login a una gestión de usuarios que lo excluye', () => {
    const result = analyze('Gestionar usuarios, pero sin login');
    expect(result.technicalSuggestedModules).toContain('Gestión de usuarios');
    expect(result.technicalSuggestedEndpoints).not.toContain(
      'POST /auth/login',
    );
  });

  it('mantiene autenticación cuando se solicita explícitamente', () => {
    expect(analyze('Login con roles').technicalSuggestedEndpoints).toContain(
      'POST /auth/login',
    );
  });
  it.each(['usuarios', 'servicios', 'precios', 'necesito información'])(
    'no confunde %s con iOS ni citas',
    (message) => {
      const result = analyze(message);
      expect(result.technicalSuggestedModules).not.toContain(
        'Aplicación móvil',
      );
      expect(result.technicalSuggestedModules).not.toContain(
        'Agenda y calendario',
      );
    },
  );

  it.each(['iOS', 'Android', 'aplicación móvil', 'APP MÓVIL'])(
    'reconoce una plataforma explícita: %s',
    (platform) => {
      expect(
        analyze(`Necesito ${platform}`).technicalSuggestedModules,
      ).toContain('Aplicación móvil');
    },
  );

  it('no interpreta una app web como móvil', () => {
    expect(
      analyze('App web para clientes').technicalSuggestedModules,
    ).not.toContain('Aplicación móvil');
  });

  it.each([
    'No necesito pagos',
    'Sin pagos ni reportes',
    'No quiero pagos. Tampoco reportes',
  ])('respeta exclusiones: %s', (message) => {
    const modules = analyze(message).technicalSuggestedModules;
    expect(modules).not.toContain('Pagos');
    expect(modules).not.toContain('Reportes');
    expect(modules).not.toContain('Carrito de compras');
  });

  it('respeta un requisito afirmativo después de una exclusión', () => {
    const modules = analyze(
      'Sin pagos, pero sí reportes en Excel',
    ).technicalSuggestedModules;
    expect(modules).not.toContain('Pagos');
    expect(modules).toContain('Reportes');
  });

  it('respeta una corrección explícita del tipo de proyecto', () => {
    expect(
      analyze('No necesito aplicación móvil', 'App móvil')
        .technicalSuggestedModules,
    ).not.toContain('Aplicación móvil');
  });

  it('no confunde no solo con una exclusión', () => {
    expect(
      analyze('No solo pagos, también reportes').technicalSuggestedModules,
    ).toContain('Pagos');
  });

  it('no agrega autenticación ni base de datos a una landing informativa', () => {
    const result = analyze('Una landing para presentar mi negocio');
    expect(result.technicalSuggestedModules).toEqual(['Contenido público']);
    expect(result.technicalSuggestedTables).toEqual([]);
    expect(result.technicalSuggestedEndpoints).toEqual([]);
    expect(result.technicalSummary).not.toContain('autenticación');
  });

  it('no extrae funcionalidades del presupuesto', () => {
    expect(
      analyze(
        'Landing informativa',
        'Idea libre',
        'Pagos mensuales para Android',
      ).technicalSuggestedModules,
    ).toEqual(['Contenido público']);
  });

  it('no agrega carrito ni ventas a un registro de pagos', () => {
    expect(analyze('Registrar pagos').technicalSuggestedModules).toEqual([
      'Pagos',
    ]);
  });

  it('mantiene funciones de ambas implementaciones', () => {
    const modules = analyze(
      'Gestionar empleados, facturación y lectura de QR',
    ).technicalSuggestedModules;
    expect(modules).toEqual(
      expect.arrayContaining([
        'Gestión de empleados',
        'Facturación',
        'Lectura de códigos o hardware',
      ]),
    );
  });

  it('pide aclarar ideas que no permiten detectar alcance', () => {
    const result = analyze('Tengo una idea');
    expect(result.technicalSuggestedModules).toEqual([]);
    expect(result.technicalDifficulty).toBe('Por definir');
    expect(result.technicalEstimatedTime).toContain('Por definir');
  });

  it('produce el mismo resultado para el planeador y los contactos', () => {
    const input = {
      projectType: 'Sistema web',
      budget: '$20,000',
      message: 'Usuarios, citas, empleados, facturación y QR, sin pagos',
    };
    expect(
      new TechnicalAgentService().analyzeIdea({
        idea: input.message,
        projectType: input.projectType,
        budget: input.budget,
      }).data,
    ).toEqual(analyzeContact(input));
  });
});
