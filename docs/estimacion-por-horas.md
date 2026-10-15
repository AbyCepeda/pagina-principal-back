# Estimación por horas del planeador

El planeador administrativo acepta `estimation` en `POST /technical-agent/analyze`:

```json
{
  "idea": "Una landing informativa",
  "estimation": {
    "hourlyRate": 300,
    "hoursPerWeek": 20,
    "contingencyPercent": 15,
    "externalCosts": 0
  }
}
```

300 MXN/h, 20 h/semana y 15% de reserva son valores iniciales editables de la interfaz, no una tarifa de mercado ni capacidad confirmada. El backend no presupone una tarifa o disponibilidad cuando se omiten.

Las tareas y sus rangos se mantienen en `src/technical-agent/effort-estimator.ts`. Son referencias para una primera versión con un desarrollador; todavía no provienen de históricos. Los módulos que comparten trabajo (agenda/disponibilidad, reportes/exportación) se agrupan para evitar duplicados.

1. Sumar alcance, configuración, módulos y entrega.
2. Añadir pruebas/correcciones (20% del mínimo, 30% del máximo, redondeadas hacia arriba).
3. Añadir la reserva elegida a cada extremo, redondeada a horas completas.
4. Precio = horas totales × tarifa + costos externos únicos; redondear hacia arriba a pesos completos.
5. Semanas = horas totales / horas semanales, redondeadas hacia arriba.

La respuesta incluye `effortEstimate` con tareas, horas, reserva, precio, semanas, configuración, versión, supuestos y exclusiones. Sin alcance o con módulos desconocidos no se da un precio. Sin tarifa o disponibilidad se deja pendiente su resultado correspondiente. No se usa el presupuesto del cliente para inflar o reducir el cálculo.

Ejemplo: una landing con estos ajustes y sin costos externos produce 29–63 h de trabajo, 5–10 h de reserva, 34–73 h totales, $10,200–$21,900 MXN y 2–4 semanas. Es una referencia preliminar que debe ajustarse tras confirmar diseño, contenido y alcance.

No incluye impuestos, mensualidades ni mantenimiento. Facturación fiscal, hardware especializado, tiempo real u operación offline requieren detalle adicional.

El cotizador público de paquetes conserva sus precios actuales en esta etapa. Los análisis históricos no se reescriben; los nuevos análisis de contactos expresan esfuerzo en horas cuando no se indica disponibilidad. El desglose editable del planeador no se guarda en la base de datos: puede copiarse con el análisis. No se necesita migración.

Para calibrar: registrar por proyecto horas estimadas frente a horas reales por tarea, revisar desvíos y actualizar el catálogo/versionado. Confirmar antes qué incluye cada paquete para conectarlo al cotizador público sin duplicar extras.
