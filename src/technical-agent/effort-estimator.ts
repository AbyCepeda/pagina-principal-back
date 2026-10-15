export type EstimationSettings = {
  hourlyRate?: number;
  hoursPerWeek?: number;
  contingencyPercent?: number;
  externalCosts?: number;
};

type Task = { id: string; label: string; minHours: number; maxHours: number };

// Referencias iniciales para un MVP; ajustar con tiempos reales de proyectos.
// Los alias comparten una tarea para no sumar dos veces el mismo trabajo.
const taskCatalog: Array<Task & { modules: string[] }> = [
  {
    id: 'public',
    label: 'Página pública adaptable',
    minHours: 12,
    maxHours: 24,
    modules: ['Contenido público'],
  },
  {
    id: 'users',
    label: 'Gestión de usuarios',
    minHours: 8,
    maxHours: 16,
    modules: ['Gestión de usuarios'],
  },
  {
    id: 'auth',
    label: 'Autenticación y permisos',
    minHours: 12,
    maxHours: 24,
    modules: ['Autenticación y roles'],
  },
  {
    id: 'admin',
    label: 'Estructura del panel administrativo',
    minHours: 8,
    maxHours: 16,
    modules: ['Panel administrativo'],
  },
  {
    id: 'appointments',
    label: 'Agenda y disponibilidad',
    minHours: 24,
    maxHours: 48,
    modules: ['Agenda y calendario', 'Disponibilidad de horarios'],
  },
  {
    id: 'clients',
    label: 'Gestión de clientes',
    minHours: 8,
    maxHours: 16,
    modules: ['Gestión de clientes'],
  },
  {
    id: 'employees',
    label: 'Empleados y responsables',
    minHours: 12,
    maxHours: 24,
    modules: ['Gestión de empleados', 'Asignación de responsables'],
  },
  {
    id: 'products',
    label: 'Catálogo de productos',
    minHours: 8,
    maxHours: 16,
    modules: ['Gestión de productos'],
  },
  {
    id: 'stock',
    label: 'Inventario y movimientos',
    minHours: 20,
    maxHours: 40,
    modules: ['Control de inventario', 'Movimientos de stock'],
  },
  {
    id: 'recipes',
    label: 'Recetas e ingredientes',
    minHours: 16,
    maxHours: 32,
    modules: ['Gestión de recetas', 'Gestión de ingredientes'],
  },
  {
    id: 'categories',
    label: 'Categorías',
    minHours: 4,
    maxHours: 8,
    modules: ['Gestión de categorías'],
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    minHours: 4,
    maxHours: 8,
    modules: ['Favoritos'],
  },
  {
    id: 'sales',
    label: 'Órdenes y carrito',
    minHours: 24,
    maxHours: 48,
    modules: ['Ventas', 'Carrito de compras'],
  },
  {
    id: 'invoices',
    label: 'Registro de facturas',
    minHours: 12,
    maxHours: 24,
    modules: ['Facturación'],
  },
  {
    id: 'reports',
    label: 'Reportes y exportación',
    minHours: 16,
    maxHours: 32,
    modules: ['Reportes', 'Exportación de información'],
  },
  {
    id: 'notifications',
    label: 'Notificaciones básicas',
    minHours: 12,
    maxHours: 24,
    modules: ['Notificaciones'],
  },
  {
    id: 'messages',
    label: 'Mensajería sin tiempo real',
    minHours: 16,
    maxHours: 32,
    modules: ['Mensajería interna'],
  },
  {
    id: 'mobile',
    label: 'Cliente móvil conectado a la API',
    minHours: 48,
    maxHours: 96,
    modules: ['Aplicación móvil'],
  },
  {
    id: 'scanner',
    label: 'Lectura de códigos e integración',
    minHours: 16,
    maxHours: 40,
    modules: ['Lectura de códigos o hardware'],
  },
  {
    id: 'payments',
    label: 'Una integración de pagos',
    minHours: 20,
    maxHours: 40,
    modules: ['Pagos'],
  },
];

export function estimateEffort(
  modules: string[],
  settings: EstimationSettings = {},
) {
  const development = taskCatalog
    .filter((task) => task.modules.some((module) => modules.includes(module)))
    .map(({ id, label, minHours, maxHours }) => ({
      id,
      label,
      minHours,
      maxHours,
    }));
  const missingModules = modules.filter(
    (module) => !taskCatalog.some((task) => task.modules.includes(module)),
  );
  const tasks: Task[] = development.length
    ? [
        {
          id: 'discovery',
          label: 'Definición de alcance y diseño de flujos',
          minHours: 4,
          maxHours: 8,
        },
        {
          id: 'setup',
          label: 'Configuración e integración del proyecto',
          minHours: 4,
          maxHours: 8,
        },
        ...development,
        {
          id: 'delivery',
          label: 'Despliegue y entrega',
          minHours: 4,
          maxHours: 8,
        },
      ]
    : [];
  const sum = (field: 'minHours' | 'maxHours') =>
    tasks.reduce((total, task) => total + task[field], 0);
  if (tasks.length)
    tasks.push({
      id: 'qa',
      label: 'Pruebas, correcciones y adaptación visual',
      minHours: Math.ceil(sum('minHours') * 0.2),
      maxHours: Math.ceil(sum('maxHours') * 0.3),
    });
  const workHours = { min: sum('minHours'), max: sum('maxHours') };
  const contingencyPercent = settings.contingencyPercent ?? 15;
  const reserveHours = {
    min: Math.ceil((workHours.min * contingencyPercent) / 100),
    max: Math.ceil((workHours.max * contingencyPercent) / 100),
  };
  const totalHours = {
    min: workHours.min + reserveHours.min,
    max: workHours.max + reserveHours.max,
  };
  const externalCosts = settings.externalCosts ?? 0;
  const canEstimate = tasks.length > 0 && missingModules.length === 0;
  const price =
    canEstimate && settings.hourlyRate
      ? {
          min: Math.ceil(totalHours.min * settings.hourlyRate + externalCosts),
          max: Math.ceil(totalHours.max * settings.hourlyRate + externalCosts),
        }
      : null;
  const weeks =
    canEstimate && settings.hoursPerWeek
      ? {
          min: Math.ceil(totalHours.min / settings.hoursPerWeek),
          max: Math.ceil(totalHours.max / settings.hoursPerWeek),
        }
      : null;
  return {
    version: 'effort-v1',
    currency: 'MXN',
    status: canEstimate ? 'preliminary' : 'needs-scope',
    tasks,
    workHours,
    reserveHours,
    totalHours,
    price,
    weeks,
    missingModules,
    settings: {
      hourlyRate: settings.hourlyRate ?? null,
      hoursPerWeek: settings.hoursPerWeek ?? null,
      contingencyPercent,
      externalCosts,
    },
    assumptions: [
      'Una persona desarrolla una primera versión con las funciones detectadas; el alcance debe confirmarse.',
      'Las horas son referencias iniciales, todavía no calibradas con proyectos terminados.',
      'Las pruebas se estiman en 20–30% del trabajo; la reserva indicada se suma una sola vez al esfuerzo.',
      'El plazo supone la disponibilidad semanal indicada y no incluye esperas de contenido o aprobaciones.',
    ],
    exclusions: [
      'Impuestos, mantenimiento y cambios de alcance.',
      'Hosting, dominio, licencias y comisiones recurrentes; solo se suma el costo externo único capturado.',
      'Timbrado fiscal, chat en tiempo real, operación offline y hardware especializado requieren alcance adicional.',
    ],
  };
}
