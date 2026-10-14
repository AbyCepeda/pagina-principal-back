import { BadRequestException } from '@nestjs/common';
import type { Plan } from '@prisma/client';

export type QuoteExtra = {
  id: string;
  label: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  complexityPoints: number;
  weeks: number;
  recommendedFor: string[];
};

export const quoteExtras: QuoteExtra[] = [
  {
    id: 'custom-design',
    label: 'Diseño personalizado',
    description: 'Diseño visual adaptado a la identidad del negocio.',
    minPrice: 2500,
    maxPrice: 5000,
    complexityPoints: 1,
    weeks: 1,
    recommendedFor: ['landing-basica', 'pagina-profesional'],
  },
  {
    id: 'admin-panel',
    label: 'Panel administrativo',
    description: 'Panel privado para gestionar información del sistema.',
    minPrice: 5000,
    maxPrice: 9000,
    complexityPoints: 2,
    weeks: 2,
    recommendedFor: [
      'pagina-profesional',
      'sistema-administrativo',
      'sistema-completo',
    ],
  },
  {
    id: 'auth-roles',
    label: 'Login, usuarios y roles',
    description: 'Acceso con autenticación, permisos y tipos de usuario.',
    minPrice: 4000,
    maxPrice: 8000,
    complexityPoints: 2,
    weeks: 2,
    recommendedFor: ['sistema-administrativo', 'sistema-completo'],
  },
  {
    id: 'database',
    label: 'Base de datos',
    description:
      'Estructura para guardar clientes, productos, citas, ventas o registros.',
    minPrice: 4000,
    maxPrice: 8000,
    complexityPoints: 2,
    weeks: 2,
    recommendedFor: ['sistema-administrativo', 'sistema-completo'],
  },
  {
    id: 'reports',
    label: 'Reportes y dashboard',
    description:
      'Gráficas, métricas, filtros y resumen de información importante.',
    minPrice: 4500,
    maxPrice: 9000,
    complexityPoints: 2,
    weeks: 2,
    recommendedFor: ['sistema-administrativo', 'sistema-completo'],
  },
  {
    id: 'payments',
    label: 'Pagos en línea',
    description: 'Integración con flujo de pago o registro de pagos.',
    minPrice: 6000,
    maxPrice: 12000,
    complexityPoints: 3,
    weeks: 3,
    recommendedFor: ['sistema-completo'],
  },
  {
    id: 'mobile-app',
    label: 'Aplicación móvil',
    description: 'App móvil conectada al backend del sistema.',
    minPrice: 12000,
    maxPrice: 25000,
    complexityPoints: 4,
    weeks: 4,
    recommendedFor: ['sistema-completo'],
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    description: 'Avisos por correo, WhatsApp o notificaciones internas.',
    minPrice: 3000,
    maxPrice: 7000,
    complexityPoints: 1,
    weeks: 1,
    recommendedFor: [
      'pagina-profesional',
      'sistema-administrativo',
      'sistema-completo',
    ],
  },
];

const planBasePrices: Record<
  string,
  {
    min: number;
    max: number;
    weeks: number;
  }
> = {
  'landing-basica': {
    min: 5000,
    max: 9000,
    weeks: 2,
  },
  'pagina-profesional': {
    min: 9000,
    max: 16000,
    weeks: 4,
  },
  'sistema-administrativo': {
    min: 18000,
    max: 32000,
    weeks: 8,
  },
  'sistema-completo': {
    min: 35000,
    max: 65000,
    weeks: 12,
  },
};

const defaultBasePrice = { min: 8000, max: 15000, weeks: 2 };

export function getQuoteCatalog() {
  return { extras: quoteExtras, planBasePrices, defaultBasePrice };
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
  // Same default as the previous estimator for custom administrator-created plans.
  const base = Object.hasOwn(planBasePrices, plan.slug)
    ? planBasePrices[plan.slug]
    : defaultBasePrice;
  const selected = quoteExtras.filter((extra) => extraIds.includes(extra.id));
  const sum = (field: 'minPrice' | 'maxPrice' | 'complexityPoints' | 'weeks') =>
    selected.reduce((total, extra) => total + extra[field], 0);
  const minPrice = base.min + sum('minPrice');
  const maxPrice = base.max + sum('maxPrice');
  const points = sum('complexityPoints');
  const complexity = points >= 7 ? 'Alta' : points >= 3 ? 'Media' : 'Baja';
  const suggestedBudget =
    maxPrice <= 10000
      ? '$5,000 - $10,000 MXN'
      : maxPrice <= 20000
        ? '$10,000 - $20,000 MXN'
        : maxPrice <= 40000
          ? '$20,000 - $40,000 MXN'
          : 'Más de $40,000 MXN';
  const minWeeks = Math.max(1, Math.ceil(base.weeks / 2));
  const maxWeeks = base.weeks + Math.ceil(sum('weeks') / 2);
  const estimatedTime =
    maxWeeks <= 1 ? '1 semana' : `${minWeeks} a ${maxWeeks} semanas`;
  const extras = selected.map(
    ({ id, label, description, minPrice, maxPrice }) => ({
      id,
      label,
      description,
      minPrice,
      maxPrice,
    }),
  );
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
      plan: {
        slug: plan.slug,
        name: plan.name,
        subtitle: plan.subtitle,
        description: plan.description,
        idealFor: plan.idealFor,
      },
      extras,
      estimate: {
        minPrice,
        maxPrice,
        suggestedBudget,
        complexity,
        estimatedTime,
      },
    },
  };
}
