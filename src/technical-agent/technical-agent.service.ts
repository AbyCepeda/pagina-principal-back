import { Injectable } from '@nestjs/common';
import { AnalyzeTechnicalIdeaDto } from './dto/analyze-technical-idea.dto';

type TechnicalAnalysisInput = {
  projectType: string;
  budget: string;
  message: string;
};

type TechnicalAnalysisResult = {
  technicalSummary: string;
  technicalDifficulty: string;
  technicalEstimatedTime: string;
  technicalSuggestedModules: string[];
  technicalSuggestedTables: string[];
  technicalSuggestedEndpoints: string[];
  technicalSuggestedScreens: string[];
  technicalChecklist: string[];
  technicalNotes: string;
};

@Injectable()
export class TechnicalAgentService {
  analyzeIdea(analyzeTechnicalIdeaDto: AnalyzeTechnicalIdeaDto) {
    const analysis = this.buildTechnicalAnalysis({
      projectType: analyzeTechnicalIdeaDto.projectType?.trim() || 'Idea libre',
      budget: analyzeTechnicalIdeaDto.budget?.trim() || 'Presupuesto no definido',
      message: analyzeTechnicalIdeaDto.idea.trim(),
    });

    return {
      success: true,
      message: 'Análisis técnico generado correctamente.',
      data: analysis,
    };
  }

  private buildTechnicalAnalysis(
    input: TechnicalAnalysisInput,
  ): TechnicalAnalysisResult {
    const text = `${input.projectType} ${input.budget} ${input.message}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const modules = new Set<string>();
    const tables = new Set<string>();
    const endpoints = new Set<string>();
    const screens = new Set<string>();
    const checklist = new Set<string>();

    const addBaseWebSystem = () => {
      modules.add('Panel administrativo');
      modules.add('Gestión de usuarios');
      modules.add('Autenticación y roles');

      tables.add('users');
      tables.add('roles');

      endpoints.add('POST /auth/login');
      endpoints.add('GET /auth/me');

      screens.add('Login');
      screens.add('Dashboard principal');

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

    addBaseWebSystem();

    if (
      text.includes('cita') ||
      text.includes('agenda') ||
      text.includes('calendario') ||
      text.includes('reservacion') ||
      text.includes('reserva')
    ) {
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

    if (
      text.includes('cliente') ||
      text.includes('clientes') ||
      text.includes('crm')
    ) {
      addCrud('clientes', 'clients', 'clients');
    }

    if (
      text.includes('empleado') ||
      text.includes('empleados') ||
      text.includes('trabajador') ||
      text.includes('trabajadores')
    ) {
      addCrud('empleados', 'employees', 'employees');

      modules.add('Asignación de responsables');

      checklist.add('Definir qué acciones puede hacer cada empleado');
    }

    if (
      text.includes('inventario') ||
      text.includes('stock') ||
      text.includes('producto') ||
      text.includes('productos') ||
      text.includes('almacen')
    ) {
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

    if (
      text.includes('receta') ||
      text.includes('recetas') ||
      text.includes('ingrediente') ||
      text.includes('ingredientes')
    ) {
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

    if (
      text.includes('venta') ||
      text.includes('ventas') ||
      text.includes('tienda') ||
      text.includes('ecommerce') ||
      text.includes('pago') ||
      text.includes('pagos')
    ) {
      modules.add('Ventas');
      modules.add('Carrito de compras');
      modules.add('Pagos');

      tables.add('orders');
      tables.add('order_items');
      tables.add('payments');

      endpoints.add('POST /orders');
      endpoints.add('GET /orders');
      endpoints.add('POST /payments');

      screens.add('Carrito');
      screens.add('Checkout');
      screens.add('Historial de compras');

      checklist.add('Definir flujo de compra');
      checklist.add('Guardar órdenes con sus productos');
      checklist.add('Definir estados de pago');
      checklist.add('Preparar validación de pagos antes de liberar productos');
    }

    if (
      text.includes('factura') ||
      text.includes('facturas') ||
      text.includes('facturacion')
    ) {
      modules.add('Facturación');
      tables.add('invoices');

      endpoints.add('GET /invoices');
      endpoints.add('POST /invoices');

      screens.add('Facturas');

      checklist.add('Definir datos fiscales requeridos');
      checklist.add('Relacionar facturas con órdenes o servicios');
    }

    if (
      text.includes('reporte') ||
      text.includes('reportes') ||
      text.includes('pdf') ||
      text.includes('excel') ||
      text.includes('estadistica') ||
      text.includes('estadisticas')
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

    if (
      text.includes('notificacion') ||
      text.includes('notificaciones') ||
      text.includes('correo') ||
      text.includes('email')
    ) {
      modules.add('Notificaciones');

      tables.add('notifications');

      endpoints.add('GET /notifications');
      endpoints.add('PATCH /notifications/:id/read');

      screens.add('Centro de notificaciones');

      checklist.add('Definir eventos que generan notificaciones');
      checklist.add('Crear contador de notificaciones pendientes');
    }

    if (
      text.includes('chat') ||
      text.includes('mensaje') ||
      text.includes('mensajes') ||
      text.includes('conversacion')
    ) {
      modules.add('Mensajería interna');

      tables.add('messages');

      endpoints.add('GET /messages');
      endpoints.add('POST /messages');

      screens.add('Conversaciones');

      checklist.add('Crear historial de mensajes');
      checklist.add('Definir lectura/no lectura de mensajes');
    }

    if (
      text.includes('app') ||
      text.includes('movil') ||
      text.includes('mobile') ||
      text.includes('android') ||
      text.includes('ios')
    ) {
      modules.add('Aplicación móvil');

      screens.add('Navegación móvil');
      screens.add('Perfil móvil');

      checklist.add('Definir navegación móvil');
      checklist.add('Crear servicios para consumir API desde mobile');
      checklist.add('Revisar si la app requiere funcionamiento offline');
    }

    if (
      text.includes('scanner') ||
      text.includes('codigo de barras') ||
      text.includes('qr') ||
      text.includes('nfc')
    ) {
      modules.add('Lectura de códigos o hardware');

      tables.add('scan_logs');

      endpoints.add('POST /scan-logs');
      endpoints.add('GET /scan-logs');

      screens.add('Escáner');

      checklist.add('Definir tecnología de lectura: QR, código de barras o NFC');
      checklist.add('Guardar historial de lecturas');
    }

    const moduleCount = modules.size;

    const technicalDifficulty =
      moduleCount <= 5 ? 'Baja' : moduleCount <= 9 ? 'Media' : 'Alta';

    const technicalEstimatedTime =
      technicalDifficulty === 'Baja'
        ? '1 a 2 semanas para prototipo'
        : technicalDifficulty === 'Media'
          ? '3 a 5 semanas para prototipo funcional'
          : '6 a 8 semanas para primera versión estable';

    const platformType =
      text.includes('movil') ||
      text.includes('mobile') ||
      text.includes('android') ||
      text.includes('ios') ||
      text.includes('app')
        ? 'móvil/web'
        : 'web';

    const technicalSummary = `La idea parece requerir un sistema ${platformType} con ${Array.from(
      modules,
    )
      .slice(0, 5)
      .join(
        ', ',
      )}. Se recomienda iniciar con un prototipo enfocado en autenticación, panel principal y los módulos centrales del negocio.`;

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
    };
  }
}