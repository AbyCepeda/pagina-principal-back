import { createRequirementMatcher } from './requirement-matcher';
import { estimateEffort } from './effort-estimator';
import type { EstimationSettings } from './effort-estimator';

export type TechnicalAnalysisInput = {
  projectType: string;
  budget: string;
  message: string;
  estimation?: EstimationSettings;
};

export type TechnicalAnalysisResult = {
  technicalSummary: string;
  technicalDifficulty: string;
  technicalEstimatedTime: string;
  technicalSuggestedModules: string[];
  technicalSuggestedTables: string[];
  technicalSuggestedEndpoints: string[];
  technicalSuggestedScreens: string[];
  technicalChecklist: string[];
  technicalNotes: string;
  effortEstimate: ReturnType<typeof estimateEffort>;
};

export function buildTechnicalAnalysis(
  input: TechnicalAnalysisInput,
): TechnicalAnalysisResult {
  const text = `${input.projectType}. ${input.message}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const mentions = createRequirementMatcher(text);

  const modules = new Set<string>();
  const tables = new Set<string>();
  const endpoints = new Set<string>();
  const screens = new Set<string>();
  const checklist = new Set<string>();

  const addBaseWebSystem = () => {
    modules.add('Gestión de usuarios');
    modules.add('Autenticación y roles');

    tables.add('users');
    tables.add('roles');

    endpoints.add('POST /auth/login');
    endpoints.add('GET /auth/me');

    screens.add('Login');

    checklist.add('Definir roles y permisos del sistema');
    checklist.add('Crear modelo de usuarios en Prisma');
    checklist.add('Crear endpoints de autenticación');
    checklist.add('Proteger rutas privadas por rol');
  };

  const addCrud = (entity: string, table: string, route: string) => {
    modules.add(`Gestión de ${entity}`);
    tables.add(table);

    endpoints.add(`GET /${route}`);
    endpoints.add(`POST /${route}`);
    endpoints.add(`PATCH /${route}/:id`);
    endpoints.add(`DELETE /${route}/:id`);

    screens.add(`Listado de ${entity}`);
    screens.add(`Formulario de ${entity}`);

    checklist.add(`Crear CRUD de ${entity}`);
    checklist.add(`Agregar validaciones para ${entity}`);
  };

  if (mentions('login', 'autenticacion', 'roles')) {
    addBaseWebSystem();
  }
  if (mentions('usuario')) {
    addCrud('usuarios', 'users', 'users');
    checklist.add('Confirmar si los usuarios necesitan acceso y permisos');
  }
  if (mentions('panel administrativo', 'dashboard')) {
    modules.add('Panel administrativo');
    screens.add('Dashboard principal');
  }
  if (mentions('landing', 'pagina informativa', 'sitio informativo')) {
    modules.add('Contenido público');
    screens.add('Página pública');
    checklist.add(
      'Definir secciones, contenido y adaptación a dispositivos móviles',
    );
  }

  if (mentions('cita', 'agenda', 'calendario', 'reservacion', 'reserva')) {
    modules.add('Agenda y calendario');
    modules.add('Disponibilidad de horarios');

    tables.add('appointments');
    tables.add('availability_slots');

    endpoints.add('GET /appointments');
    endpoints.add('POST /appointments');
    endpoints.add('PATCH /appointments/:id/status');

    screens.add('Calendario de citas');
    screens.add('Detalle de cita');

    checklist.add('Validar disponibilidad antes de crear una cita');
    checklist.add('Crear estados de cita: pendiente, confirmada, cancelada');
  }

  if (mentions('cliente', 'clientes', 'crm')) {
    addCrud('clientes', 'clients', 'clients');
  }

  if (mentions('empleado', 'empleados', 'trabajador', 'trabajadores')) {
    addCrud('empleados', 'employees', 'employees');

    modules.add('Asignación de responsables');

    checklist.add('Definir qué acciones puede hacer cada empleado');
  }

  if (mentions('inventario', 'stock', 'producto', 'productos', 'almacen')) {
    addCrud('productos', 'products', 'products');

    modules.add('Control de inventario');
    modules.add('Movimientos de stock');

    tables.add('stock_movements');

    endpoints.add('POST /stock-movements');
    endpoints.add('GET /stock-movements');

    screens.add('Inventario');
    screens.add('Historial de movimientos');

    checklist.add('Definir entradas y salidas de inventario');
    checklist.add('Actualizar stock automáticamente por movimiento');
    checklist.add('Agregar validación para evitar stock negativo');
  }

  if (mentions('receta', 'recetas', 'ingrediente', 'ingredientes')) {
    addCrud('recetas', 'recipes', 'recipes');
    addCrud('categorías', 'categories', 'categories');

    modules.add('Gestión de ingredientes');
    modules.add('Favoritos');

    tables.add('ingredients');
    tables.add('recipe_ingredients');
    tables.add('favorites');

    endpoints.add('POST /recipes/:id/favorite');
    endpoints.add('DELETE /recipes/:id/favorite');

    screens.add('Detalle de receta');
    screens.add('Mis recetas favoritas');

    checklist.add('Relacionar recetas con ingredientes');
    checklist.add('Permitir marcar recetas como favoritas');
    checklist.add('Agregar filtros por categoría');
  }

  if (mentions('venta', 'ventas', 'tienda', 'ecommerce')) {
    modules.add('Ventas');
    modules.add('Carrito de compras');

    tables.add('orders');
    tables.add('order_items');

    endpoints.add('POST /orders');
    endpoints.add('GET /orders');

    screens.add('Carrito');
    screens.add('Checkout');
    screens.add('Historial de compras');

    checklist.add('Definir flujo de compra');
    checklist.add('Guardar órdenes con sus productos');
  }

  if (mentions('factura', 'facturas', 'facturacion')) {
    modules.add('Facturación');
    tables.add('invoices');

    endpoints.add('GET /invoices');
    endpoints.add('POST /invoices');

    screens.add('Facturas');

    checklist.add('Definir datos fiscales requeridos');
    checklist.add('Relacionar facturas con órdenes o servicios');
  }

  if (
    mentions(
      'reporte',
      'reportes',
      'pdf',
      'excel',
      'estadistica',
      'estadisticas',
    )
  ) {
    modules.add('Reportes');
    modules.add('Exportación de información');

    endpoints.add('GET /reports/summary');
    endpoints.add('GET /reports/export');

    screens.add('Reportes');
    screens.add('Dashboard de métricas');

    checklist.add('Definir métricas principales del negocio');
    checklist.add('Agregar filtros por fecha');
    checklist.add('Preparar exportación PDF o Excel');
  }

  if (mentions('notificacion', 'notificaciones', 'correo', 'email')) {
    modules.add('Notificaciones');

    tables.add('notifications');

    endpoints.add('GET /notifications');
    endpoints.add('PATCH /notifications/:id/read');

    screens.add('Centro de notificaciones');

    checklist.add('Definir eventos que generan notificaciones');
    checklist.add('Crear contador de notificaciones pendientes');
  }

  if (mentions('chat', 'mensaje', 'mensajes', 'conversacion')) {
    modules.add('Mensajería interna');

    tables.add('messages');

    endpoints.add('GET /messages');
    endpoints.add('POST /messages');

    screens.add('Conversaciones');

    checklist.add('Crear historial de mensajes');
    checklist.add('Definir lectura/no lectura de mensajes');
  }

  if (
    mentions(
      'app movil',
      'aplicacion movil',
      'movil',
      'mobile',
      'android',
      'ios',
    )
  ) {
    modules.add('Aplicación móvil');

    screens.add('Navegación móvil');
    screens.add('Perfil móvil');

    checklist.add('Definir navegación móvil');
    checklist.add('Crear servicios para consumir API desde mobile');
    checklist.add('Revisar si la app requiere funcionamiento offline');
  }

  if (mentions('scanner', 'codigo de barras', 'qr', 'nfc')) {
    modules.add('Lectura de códigos o hardware');

    tables.add('scan_logs');

    endpoints.add('POST /scan-logs');
    endpoints.add('GET /scan-logs');

    screens.add('Escáner');

    checklist.add('Definir tecnología de lectura: QR, código de barras o NFC');
    checklist.add('Guardar historial de lecturas');
  }

  if (mentions('pago', 'pagos', 'pasarela de pago')) {
    modules.add('Pagos');
    tables.add('payments');
    endpoints.add('POST /payments');
    screens.add('Registro de pagos');
    checklist.add(
      'Definir estados de pago y validar la confirmación del proveedor',
    );
  }

  const moduleCount = modules.size;

  const technicalDifficulty =
    moduleCount === 0
      ? 'Por definir'
      : moduleCount <= 5
        ? 'Baja'
        : moduleCount <= 9
          ? 'Media'
          : 'Alta';

  const effortEstimate = estimateEffort(Array.from(modules), input.estimation);
  const technicalEstimatedTime = effortEstimate.weeks
    ? `${effortEstimate.weeks.min} a ${effortEstimate.weeks.max} semanas según disponibilidad`
    : moduleCount === 0
      ? 'Por definir al confirmar el alcance'
      : `${effortEstimate.totalHours.min} a ${effortEstimate.totalHours.max} horas; semanas por definir según disponibilidad`;

  const platformType = modules.has('Aplicación móvil') ? 'móvil/web' : 'web';

  const technicalSummary = modules.size
    ? `La solicitud sugiere una solución ${platformType} con ${Array.from(modules).slice(0, 5).join(', ')}. Validar el alcance y las funciones detectadas antes de desarrollar.`
    : 'No hay suficiente información para proponer módulos. Aclarar el objetivo, los usuarios y los procesos necesarios.';

  if (!modules.size)
    checklist.add('Confirmar el alcance y las funcionalidades con el cliente');

  const technicalNotes =
    'Este análisis fue generado por un agente técnico basado en reglas internas. Sirve como primera planeación, pero debe validarse antes de convertirlo en tareas finales de desarrollo.';

  return {
    technicalSummary,
    technicalDifficulty,
    technicalEstimatedTime,
    technicalSuggestedModules: Array.from(modules),
    technicalSuggestedTables: Array.from(tables),
    technicalSuggestedEndpoints: Array.from(endpoints),
    technicalSuggestedScreens: Array.from(screens),
    technicalChecklist: Array.from(checklist),
    technicalNotes,
    effortEstimate,
  };
}
