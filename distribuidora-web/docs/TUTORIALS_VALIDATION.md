# Validación de tutoriales Driver.js

Fecha: 2026-09-16

## Cobertura funcional

- Centro de tutoriales agrupado por los módulos General y F01–F09.
- Procesos esenciales destacados: registrar cliente, registrar producto, crear compra y cobrar con tarjeta.
- Cada proceso esencial contiene entre 8 y 9 pasos, con preparación, secuencia, validaciones, resultado y recuperación ante errores.
- Los recorridos respetan permisos, continúan desde el último paso y pueden reiniciarse.
- Driver.js se carga de forma diferida y no forma parte del paquete inicial.
- Los recorridos no hacen clic, no envían formularios y no llaman operaciones de escritura.

## Accesibilidad y diseño

- Navegación por teclado, cierre accesible, indicador de progreso y restauración del foco al botón de ayuda.
- Estilos alineados con los tokens visuales de la aplicación y adaptación móvil.
- Respeto a `prefers-reduced-motion`.
- Sin desbordamiento horizontal en las vistas verificadas.

## Evidencia automatizada

- Lint: aprobado.
- Pruebas unitarias: 22 archivos y 59 pruebas aprobadas.
- Compilación de producción: aprobada; Driver.js queda en un bloque diferido de aproximadamente 25.5 kB sin comprimir.
- Playwright: 70 de 70 pruebas aprobadas en 320 px, móvil, tableta, escritorio y pantalla amplia.
- La prueba del centro confirma los cuatro procesos esenciales, pausa/reanudación, foco restaurado y cero solicitudes mutantes durante el recorrido.
- Captura visual: `test-results/tutorial-center-desktop.png`.

## Observaciones

- La compilación conserva una advertencia previa: la hoja de estilos de punto de venta supera su presupuesto de 7 kB por 1.21 kB.
- Las pruebas E2E usan el puerto 4201 para no reutilizar accidentalmente una instancia Docker expuesta en el puerto 4200.
