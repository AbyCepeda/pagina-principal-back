# Registro de horas para calibrar estimaciones

Esta plantilla permite empezar a medir sin reconstruir de memoria los proyectos anteriores. No cambia los precios ni las horas del cotizador automáticamente. Las estimaciones siguen siendo preliminares hasta contar con registros comparables.

## Cómo empezar

1. Copia la ficha siguiente en una nota propia para cada trabajo. Usa un alias de proyecto, sin datos del cliente.
2. Antes de empezar, guarda el alcance, la versión del motor y el desglose estimado. Puedes copiarlos desde el agente o una cotización guardada.
3. Anota cada sesión de trabajo en minutos, descontando pausas. Incluye investigación, lectura, revisión de código generado y pruebas: también son trabajo.
4. Separa el alcance original de las funciones añadidas después. No cuentes como trabajo la espera de una respuesta o una generación automática si no estás trabajando durante ella.
5. Al terminar una tarea, suma sus minutos y divide entre 60. Déjala pendiente mientras siga incompleta; una casilla vacía significa desconocido, no cero.

Puedes empezar con el próximo CRUD, login o formulario que desarrolles. No necesitas medir un proyecto entero para obtener el primer registro útil.

## Ficha para copiar

- Proyecto o módulo:
- Fecha de inicio / finalización:
- Alcance acordado (pantallas, endpoints, permisos y criterios de aceptación):
- Fuera del alcance:
- Código reutilizado y herramientas utilizadas:
- Versión de la estimación:
- Estimación original o referencia a su copia:
- Horas disponibles por semana:
- Estado: en curso / terminado / cancelado

### Sesiones

Usa una fila por actividad. Si una sesión mezcla implementación y pruebas, divide el tiempo entre ambas sin duplicarlo.

| Fecha | ID de tarea | Actividad | Minutos efectivos | Alcance original o añadido | Observaciones |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

### Cierre por tarea

Copia los rangos originales antes de trabajar; no los sustituyas después por la duración real.

| ID de tarea | Alcance concreto | Mín. estimado (h) | Máx. estimado (h) | Real original (h) | Real añadido (h) | Estado | Motivo de diferencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

- Horas efectivas totales del alcance original:
- Horas efectivas de ampliaciones:
- Semanas transcurridas y disponibilidad efectiva:
- Días de espera y motivo (separados de las horas trabajadas):
- Qué se reutilizaría en un trabajo parecido:
- Qué quedó pendiente:

## Correspondencia con el motor

Usa el `id` de cada tarea del desglose original. Estas son algunas referencias frecuentes de `src/technical-agent/effort-estimator.ts`:

| ID | Qué registrar |
| --- | --- |
| `discovery` | Aclarar requisitos, alcance y flujos. |
| `setup` | Preparar e integrar el proyecto. |
| `database` | Configuración y estructura inicial de la base de datos. |
| `auth` | Autenticación y permisos. |
| `business-crud` | Un CRUD de negocio con interfaz y API. |
| `second-crud` | El segundo CRUD incluido en el alcance. |
| `public` | Construcción de la página pública adaptable. |
| `visual-design` | Diseño visual personalizado, cuando se cotiza por separado. |
| `contact-form` | Formulario de contacto, validación y envío. |
| `qa` | Pruebas, correcciones y revisión de adaptación visual. |
| `delivery` | Despliegue y entrega. |

No contabilices la misma sesión en dos tareas. La implementación de una pantalla adaptable corresponde a su módulo; comprobarla y corregir defectos corresponde a `qa`. Usa la misma separación en todos los registros.

La reserva no es una tarea a la que asignar horas: es un margen presupuestado. Registra el tiempo real en la tarea donde se consumió, sin añadir de nuevo un porcentaje al total real.

## Cómo revisar los resultados

- Compara tareas terminadas de alcance y condiciones similares. Un CRUD simple no equivale a inventario con movimientos o reglas de negocio complejas.
- Si las horas originales reales están dentro del rango estimado, ese registro es compatible con el rango. Un solo caso no demuestra que esté calibrado.
- Si están fuera, anota la causa: alcance omitido, aprendizaje, reutilización, integración, errores o complejidad. Las ampliaciones se analizan por separado.
- Con varios registros comparables, revisa cada rango y documenta cuántos casos lo respaldan. Como punto de partida práctico, reúne al menos tres por tarea; esto no garantiza precisión estadística.
- Revisa también alcance, preparación, entrega y pruebas. No ajustes únicamente las horas de programación.
- Para evaluar el total, compara las horas originales reales con `workHours` y con `totalHours`: el segundo ya incluye reserva. Esto permite ver si se consumió el margen sin sumarlo dos veces.

Las horas reales ayudan a corregir el esfuerzo. La tarifa por hora es una decisión comercial distinta; registrar tiempos no determina automáticamente una tarifa de mercado. Para revisar las semanas, usa tu disponibilidad efectiva y mantén separadas las esperas.

## Aplicar una calibración

Cuando haya evidencia, actualizar los rangos correspondientes del motor, incrementar su versión y ajustar las pruebas y ejemplos afectados. Revisar el impacto tanto en el agente como en los paquetes públicos antes de publicar. Mantener los importes y desgloses históricos guardados en `quoteSnapshot`.

Hasta entonces, conservar los valores provisionales y su advertencia en la interfaz. Esta plantilla no requiere cambios de base de datos ni ejecutar seeds.
