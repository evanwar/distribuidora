# Tutoriales guiados

Los tutoriales viven en `src/app/core/tutorials`. El centro se abre desde el botón de ayuda del toolbar y solo muestra recorridos permitidos para la sesión.

El buscador del centro localiza recorridos por título, descripción, módulo y contenido de sus pasos. Ignora mayúsculas y acentos, y busca tanto el texto español como el inglés.

## Procesos esenciales

El centro destaca con la etiqueta **Proceso esencial** las guías operativas que una persona necesita dominar primero:

- Cómo registrar un cliente: búsqueda de duplicados, identidad, contacto, condiciones comerciales, guardado y comprobación.
- Cómo registrar un producto: búsqueda previa, SKU y código, clasificación, unidad, costos, precios, estado y comprobación.
- Cómo crear una compra: proveedor, almacén, productos, cantidades, costos, confirmación y recepción posterior.
- Cómo cobrar con tarjeta: revisión del total, método y terminal, inicio único del cobro, respuesta, comprobante y manejo de interrupciones.

Estos recorridos explican el objetivo, los requisitos previos, la secuencia completa, las validaciones y el resultado esperado. Deben conservar al menos ocho pasos y nunca ejecutar la operación por la persona usuaria.

## Agregar o cambiar un recorrido

1. Usa o agrega un selector semántico en `tutorial-selectors.ts`.
2. Coloca `data-tour` en el componente dueño, nunca sobre internals de Angular Material.
3. Define el recorrido dentro del archivo F01-F09 correspondiente.
4. Mantén entre 5 y 10 pasos, con una idea y una precaución por paso.
5. Marca como opcional todo objetivo dependiente de datos o estado.
6. Incrementa `version` cuando el cambio haga necesario repetir la guía.
7. Agrega o actualiza pruebas unitarias y E2E.

Los recorridos no deben ejecutar clicks, guardar formularios ni invocar adapters. Para una pantalla aún inexistente, no agregues un selector ficticio: documenta el pendiente y añade el paso cuando exista la superficie real.

## Progreso

El navegador guarda solo ID, versión, estado, último paso y fecha bajo `distribuidora:tutorial-progress:v1`. Un JSON inválido se descarta de forma segura. No se sincroniza con backend porque no existe contrato OpenAPI para ello.

## Mantenimiento visual

El tema global está bajo `.driver-popover.distribuidora-tour`. Usa únicamente tokens `--app-*` y `--space-*`. Verifica 320 px, móvil, tableta, escritorio, zoom 200%, teclado y `prefers-reduced-motion` después de cambios visuales.
