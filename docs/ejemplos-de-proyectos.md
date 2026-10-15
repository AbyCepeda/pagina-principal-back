# Ejemplos visuales del portafolio

`prisma/project-examples.ts` define cinco demos conceptuales: e-commerce, ERP, CRM, pedidos para restaurantes y reservas para consultorios. Se muestran como ejemplos de soluciones, con datos ficticios, no como trabajos entregados a clientes.

Para agregarlos a la base configurada en `DATABASE_URL`:

```sh
npx tsx prisma/seed-project-examples.ts
```

El script crea únicamente los ejemplos ausentes, compara sus títulos sin distinguir mayúsculas y conserva los registros existentes, incluso si fueron editados u ocultados. Usa una transacción y un bloqueo para evitar duplicados entre ejecuciones simultáneas. No requiere migraciones ni ejecutar el seed general.

Se pueden editar u ocultar desde Proyectos en el administrador. El frontend selecciona su mockup por el título o tipo: `E-commerce`, `ERP`, `CRM`, `Restaurante` o `Consultorio`. Conserva ese tipo si cambias el título. Si asignas una imagen, esta reemplazará la portada generada; el mockup seguirá disponible al abrirlo.

Las pantallas de ejemplo permiten modificar un carrito, avanzar estados, mover prospectos o simular una reserva. Esas interacciones viven solo en el navegador y se reinician al cambiar de vista o cerrar la demo. No realizan pedidos, cobros, reservas ni envíos reales.

Cada ejemplo tiene cinco vistas:

| Ejemplo | Recorrido |
| --- | --- |
| E-commerce | Catálogo y carrito → entrega y confirmación → gestión de pedidos → seguimiento del envío → recorrido de compra. |
| ERP | Centro de operaciones → orden de compra → recepción e inventario → reporte por área → flujo entre áreas. |
| CRM | Embudo de ventas → ficha del cliente → agenda comercial → resultados de ventas → seguimiento comercial. |
| Restaurante | Menú y pedido → confirmación del pedido → tablero de cocina → estado de la entrega → servicio al cliente. |
| Consultorio | Reserva de consulta → confirmación de cita → agenda del consultorio → próximas citas → experiencia del paciente. |

Cada vista usa su propio escenario ficticio: los comprobantes y confirmaciones no heredan la selección de otra pantalla. Esta ampliación es del frontend; no requiere volver a cargar los registros ni modificar Neon.
