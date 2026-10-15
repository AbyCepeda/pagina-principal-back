import { BadRequestException } from '@nestjs/common';
import type { Plan } from '@prisma/client';
import { estimateEffort } from '../technical-agent/effort-estimator';

// Configuración comercial pública; las simulaciones del admin no la modifican.
export const publicQuoteSettings = {
  hourlyRate: 300,
  hoursPerWeek: 20,
  contingencyPercent: 15,
  externalCosts: 0,
};

export const quoteExtras = [
  {
    id: 'custom-design',
    label: 'Diseño personalizado',
    description:
      'Diseño visual a medida para las pantallas del alcance acordado.',
    modules: ['Diseño personalizado'],
  },
  {
    id: 'admin-panel',
    label: 'Panel administrativo',
    description: 'Panel privado con acceso, usuarios y permisos básicos.',
    modules: [
      'Panel administrativo',
      'Gestión de usuarios',
      'Autenticación y roles',
      'Base de datos',
    ],
  },
  {
    id: 'auth-roles',
    label: 'Login, usuarios y roles',
    description: 'Acceso privado con usuarios y permisos básicos.',
    modules: ['Gestión de usuarios', 'Autenticación y roles', 'Base de datos'],
  },
  {
    id: 'database',
    label: 'Base de datos',
    description: 'Configuración y estructura inicial para guardar información.',
    modules: ['Base de datos'],
  },
  {
    id: 'reports',
    label: 'Reportes y dashboard',
    description: 'Un reporte básico con filtros y una exportación PDF o Excel.',
    modules: ['Reportes', 'Exportación de información'],
  },
  {
    id: 'payments',
    label: 'Pagos en línea',
    description: 'Integración con un proveedor de pagos; comisiones aparte.',
    modules: ['Pagos', 'Base de datos'],
  },
  {
    id: 'mobile-app',
    label: 'Aplicación móvil',
    description:
      'Cliente móvil conectado a la API del alcance; publicación y offline por revisar.',
    modules: ['Aplicación móvil', 'Base de datos'],
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    description:
      'Un canal de avisos básicos: correo o notificaciones internas. WhatsApp requiere revisión.',
    modules: ['Notificaciones', 'Base de datos'],
  },
];

type PlanScope = {
  includedFeatures: string[];
  limits: string[];
  modules: string[];
};
export const planScopes: Record<string, PlanScope> = {
  'landing-basica': {
    includedFeatures: [
      'Una página adaptable con hasta 5 secciones',
      'Formulario de contacto',
      'Enlaces a redes y SEO básico',
    ],
    limits: [
      'Contenido e imágenes proporcionados por el cliente.',
      'El alcance base no incluye cuentas de usuario ni panel privado.',
    ],
    modules: ['Contenido público', 'Formulario de contacto', 'SEO básico'],
  },
  'pagina-profesional': {
    includedFeatures: [
      'Página pública con diseño personalizado',
      'Servicios y galería de proyectos',
      'Formulario con almacenamiento de solicitudes',
      'Panel básico de contactos, usuarios y acceso privado',
    ],
    limits: [
      'Hasta 5 secciones públicas y una galería.',
      'El panel administra contactos; otros procesos de negocio se cotizan aparte.',
    ],
    modules: [
      'Contenido público',
      'Diseño personalizado',
      'Galería de proyectos',
      'Formulario de contacto',
      'SEO básico',
      'Bandeja de contactos',
      'Panel administrativo',
      'Gestión de usuarios',
      'Autenticación y roles',
      'Base de datos',
    ],
  },
  'sistema-administrativo': {
    includedFeatures: [
      'Panel privado, login y dos roles básicos',
      'Gestión de usuarios y base de datos',
      'Un CRUD de negocio con listado, formulario y API',
    ],
    limits: [
      'Un proceso sencillo, por ejemplo un directorio de clientes.',
      'Agenda, movimientos de inventario y automatizaciones complejas requieren ampliar el alcance.',
    ],
    modules: [
      'Panel administrativo',
      'Gestión de usuarios',
      'Autenticación y roles',
      'Base de datos',
      'CRUD de negocio',
    ],
  },
  'sistema-completo': {
    includedFeatures: [
      'Página pública y panel administrativo',
      'Login, usuarios, roles y base de datos',
      'Dos CRUD de negocio y API',
      'Un reporte básico con exportación',
    ],
    limits: [
      'Dos procesos sencillos con relaciones básicas.',
      'La aplicación móvil y los pagos son opcionales y se cotizan como extras.',
    ],
    modules: [
      'Contenido público',
      'Panel administrativo',
      'Gestión de usuarios',
      'Autenticación y roles',
      'Base de datos',
      'CRUD de negocio',
      'Segundo CRUD de negocio',
      'Reportes',
      'Exportación de información',
    ],
  },
};

export function getQuoteCatalog() {
  return {
    version: 'public-effort-v1',
    settings: publicQuoteSettings,
    extras: quoteExtras.map(({ id, label, description }) => ({
      id,
      label,
      description,
    })),
    plans: Object.fromEntries(
      Object.entries(planScopes).map(([slug, scope]) => [
        slug,
        {
          includedFeatures: scope.includedFeatures,
          limits: scope.limits,
          includedExtraIds: quoteExtras
            .filter((extra) =>
              extra.modules.every((module) => scope.modules.includes(module)),
            )
            .map((extra) => extra.id),
        },
      ]),
    ),
  };
}

export function calculateQuote(
  plan: Pick<Plan, 'slug' | 'name' | 'subtitle' | 'description' | 'idealFor'>,
  extraIds: string[],
) {
  if (
    new Set(extraIds).size !== extraIds.length ||
    extraIds.some((id) => !quoteExtras.some((extra) => extra.id === id))
  ) {
    throw new BadRequestException('Los extras seleccionados no son válidos.');
  }
  const scope = Object.hasOwn(planScopes, plan.slug)
    ? planScopes[plan.slug]
    : undefined;
  const selected = quoteExtras.filter((extra) => extraIds.includes(extra.id));
  const modules = scope
    ? [
        ...new Set([
          ...scope.modules,
          ...selected.flatMap((extra) => extra.modules),
        ]),
      ]
    : [];
  const effort = estimateEffort(modules, publicQuoteSettings);
  const minPrice = effort.price?.min ?? null;
  const maxPrice = effort.price?.max ?? null;
  const complexity = !scope
    ? 'Por definir'
    : effort.totalHours.max >= 200
      ? 'Alta'
      : effort.totalHours.max >= 100
        ? 'Media'
        : 'Baja';
  const suggestedBudget =
    maxPrice === null
      ? 'Por definir'
      : maxPrice <= 10000
        ? '$5,000 - $10,000 MXN'
        : maxPrice <= 20000
          ? '$10,000 - $20,000 MXN'
          : maxPrice <= 40000
            ? '$20,000 - $40,000 MXN'
            : 'Más de $40,000 MXN';
  const estimatedTime = effort.weeks
    ? `${effort.weeks.min} a ${effort.weeks.max} semanas`
    : 'Por definir al confirmar el alcance';
  const includedExtraIds = scope
    ? quoteExtras
        .filter((extra) =>
          extra.modules.every((module) => scope.modules.includes(module)),
        )
        .map((extra) => extra.id)
    : [];
  const extras = selected.map(({ id, label, description }) => ({
    id,
    label,
    description,
    included: includedExtraIds.includes(id),
  }));
  return {
    quotePlanSlug: plan.slug,
    quotePlanName: plan.name,
    quoteMinPrice: minPrice,
    quoteMaxPrice: maxPrice,
    quoteSuggestedBudget: suggestedBudget,
    quoteComplexity: complexity,
    quoteEstimatedTime: estimatedTime,
    quoteExtras: extras,
    quoteSnapshot: {
      version: 'public-effort-v1',
      plan: {
        slug: plan.slug,
        name: plan.name,
        subtitle: plan.subtitle,
        description: plan.description,
        idealFor: plan.idealFor,
      },
      scope: {
        includedFeatures: scope?.includedFeatures ?? [],
        limits: scope?.limits ?? [
          'Este paquete necesita un alcance acordado antes de fijar precio.',
        ],
        includedExtraIds,
      },
      extras,
      estimate: {
        minPrice,
        maxPrice,
        suggestedBudget,
        complexity,
        estimatedTime,
      },
      effort,
    },
  };
}
