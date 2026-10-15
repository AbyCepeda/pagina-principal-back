# Paquetes y cotizador público

El motor de horas es compartido con el planeador. Los alcances comerciales están en `planScopes` y los ajustes en `publicQuoteSettings`, ambos en `src/contact/quote-estimator.ts`.

| Paquete | Alcance base |
| --- | --- |
| Landing básica | Una página adaptable de hasta 5 secciones, contacto y SEO básico. |
| Página profesional | Página personalizada, servicios, galería, contacto almacenado y panel de mensajes con acceso privado. |
| Sistema administrativo | Panel, usuarios, dos roles básicos, base de datos y un CRUD de negocio sencillo. |
| Sistema completo | Página pública, panel, usuarios, roles, base de datos, dos CRUD sencillos y un reporte con exportación. App móvil y pagos opcionales. |

Contenido e imágenes los proporciona el cliente. Citas, inventario con movimientos y otras reglas complejas requieren ampliar el alcance; un CRUD sencillo no incluye automáticamente toda la operación del negocio.

Los ajustes iniciales son 300 MXN/h, 20 h/semana, 15% de reserva y cero costos externos únicos. Son supuestos provisionales, no una tarifa de mercado ni capacidad confirmada. Cambiar una simulación en el admin no modifica estos ajustes públicos. Revisarlos antes de publicar y calibrarlos con horas reales.

## Flujo

1. `GET /contact/quote-catalog` entrega alcance, extras incluidos y ajustes.
2. `POST /contact/quote-preview` recibe `{ "quotePlanSlug": "sistema-administrativo", "quoteExtraIds": [] }`, valida que el paquete exista y esté activo, y calcula sin guardar solicitudes.
3. El navegador muestra el resultado del servidor. No preselecciona extras. Las funciones incluidas se identifican y no se pueden añadir de nuevo en la interfaz. El servidor también deduplica módulos y tareas compartidas aunque se le envíen extras superpuestos.
4. `POST /contact` vuelve a calcular y guarda precio, alcance, tareas, horas, ajustes y versión en `quoteSnapshot`. No acepta precios ni tarifas del cliente. Mientras una selección está calculándose o ha fallado, la interfaz impide enviarla con resultados anteriores.

Un slug personalizado sin alcance registrado queda pendiente: precios y semanas nulos. Se puede enviar la solicitud con el presupuesto elegido por el cliente para revisar el alcance. No se inventa un precio genérico.

Las tarjetas comerciales administradas en la base de datos no cambian automáticamente el alcance del motor. Si se modifica lo que incluye un paquete, actualizar `planScopes` y su texto comercial conjuntamente. Editar el nombre o descripción no altera sus horas; cambiar el slug a uno desconocido deja el cálculo pendiente.

Ejemplo de landing base: 36–78 h de trabajo (incluidas pruebas), 6–12 h de reserva, 42–90 h totales; 12,600–27,000 MXN y 3–5 semanas con estos ajustes. Añadir diseño personalizado da 59–127 h y 17,700–38,100 MXN. El agente de ideas libres puede dar otro alcance y, por tanto, otras horas: mencionar solamente una landing no equivale al paquete con formulario y SEO.

No incluye impuestos, hosting, dominio, licencias, comisiones recurrentes ni mantenimiento. El precio y el plazo necesitan confirmación de alcance. No se requiere migración ni ejecutar el seed. Las cotizaciones históricas conservan sus cifras.

## Consulta de cotizaciones guardadas

En Solicitudes del administrador y Mis solicitudes del cliente, «Ver alcance y desglose guardados» muestra el contenido de `quoteSnapshot`: funciones incluidas, límites, tareas, horas, tarifa registrada, reserva y exclusiones. No consulta el catálogo actual ni vuelve a calcular importes históricos. «Copiar cotización» también incluye ese desglose y confirma el éxito solo después de escribir en el portapapeles.

Los registros anteriores sin desglose mantienen su resumen y muestran que no se guardaron las horas. Los paquetes personalizados sin alcance muestran «Precio por definir» y evitan presentar cero horas como una estimación válida. No hay cambios en permisos, endpoints ni base de datos para esta visualización.

Validación: `npm run test:unit`, `npm run test:e2e`, `npm run test:swagger`; frontend `npm run build`. Las pruebas de integración usan Prisma simulado.
