---
project: Distribuidora Frontend - MVP Mostrador
stack: Angular 21.x, TypeScript strict, Angular Material 3, CDK, Signals, RxJS, Reactive Forms, OpenAPI, Vitest, Playwright
architecture: Single SPA + Feature-First + Vertical Slice UI
scope: Frontend only, ventas por mostrador, sin rutas ni camiones
backend_contract: ASP.NET Core Web API + PostgreSQL, paquete backend MVP Mostrador
---

# F05 - Punto de venta / ventas por mostrador

## Prompt del agente

```text
Implementa con Angular Material 3 y diseño mobile-first 100% responsive la estación de venta por mostrador como el flujo más optimizado del sistema. Debe funcionar principalmente con teclado y escáner, evitar cobros duplicados y respetar stock, precios, crédito y permisos devueltos por backend.
```

## Objetivo

Crear, confirmar, cobrar, consultar e imprimir ventas de mostrador de forma rápida y segura.

## Layout recomendado

```text
encabezado: cliente, folio/borrador, vendedor
búsqueda: SKU/código/nombre con foco permanente
centro: carrito editable
lateral: subtotal, descuentos, impuestos, total
acciones: guardar borrador, cobrar/confirmar, cancelar
```

## Slices mínimos

- Nueva venta/borrador.
- Búsqueda y selección de producto.
- Agregar/quitar/cambiar cantidad.
- Seleccionar cliente.
- Aplicar precio/descuento solo con permiso y contrato.
- Seleccionar contado, crédito o mixto.
- Capturar uno o varios pagos si API lo permite.
- En pago en efectivo, capturar el efectivo recibido y mostrar el cambio a devolver.
- Confirmar venta.
- Mostrar comprobante/resumen.
- Imprimir.
- Consultar y cancelar venta con motivo.

## Estado sugerido

```text
saleDraft
productSearch
cartLines
selectedCustomer
paymentDraft
cashTendered
quotePreview
serverTotals
submitting
lastConfirmedSale
```

`quotePreview` es informativo. `serverTotals` y la venta confirmada son autoritativos.

`cashTendered` es un dato de interacción local para calcular el cambio; no altera el total autoritativo ni se envía como importe pagado salvo que el contrato OpenAPI incluya expresamente ese campo.

## Atajos mínimos

Definirlos en configuración documentada, por ejemplo:

```text
F2 o Ctrl+K: buscar producto
F4: seleccionar cliente
F8: abrir cobro
F9: confirmar
Esc: cerrar diálogo/restaurar foco
```

No capturar atajos cuando el foco esté en un control donde puedan destruir entrada del usuario.

## Reglas UX críticas

- Foco vuelve al buscador después de agregar producto.
- Lectura de código exacto agrega producto o muestra selección inequívoca.
- Producto repetido incrementa cantidad según política, no crea líneas ambiguas.
- Confirmar queda deshabilitado mientras hay request activo.
- Nunca limpiar el carrito antes de recibir confirmación del backend.
- Error de stock insuficiente identifica líneas afectadas y conserva el borrador.
- Venta a crédito exige cliente.
- Al seleccionar el método **Efectivo**, mostrar un `mat-form-field` monetario obligatorio con la etiqueta **Efectivo recibido**; ocultarlo y limpiar su valor al cambiar a un método que no sea efectivo.
- El efectivo recibido debe aceptar únicamente importes finitos, positivos y con hasta dos decimales. Mientras sea menor al importe pendiente que cubre ese pago, mostrar **El efectivo recibido es menor al total a cobrar** y mantener deshabilitada la confirmación.
- Calcular la vista previa con `cambio = max(efectivoRecibido - importeEfectivoACubrir, 0)` mediante estado derivado (`computed`), sin lógica aritmética en la plantilla y sin redondear nuevamente los totales autoritativos del backend.
- Cuando el efectivo recibido supere el importe a cubrir, mostrar de forma inmediata y accesible **Cambio a devolver** con formato MXN y prominencia suficiente; si es igual, mostrar `$0.00` o no destacar el bloque de cambio, pero nunca presentar un valor negativo.
- En pago mixto, `importeEfectivoACubrir` corresponde solo a la porción asignada a efectivo. El importe registrado como pago sigue siendo la deuda cubierta; el excedente entregado por el cliente es cambio, no un pago adicional.
- Cancelación exige motivo y resumen del impacto.
- El comprobante muestra folio y estado reales.

## Permisos esperados

```text
sales.view
sales.create
sales.edit_draft
sales.confirm
sales.register_payment
sales.manual_price
sales.discount
sales.cancel
sales.print
```

## Pruebas unitarias/componentes

- escáner/Enter agrega producto.
- producto repetido actualiza línea.
- total preview se deriva sin mutar DTO.
- confirmación bloquea doble click.
- stock insuficiente conserva carrito.
- permiso de descuento controla UI.
- método efectivo exige efectivo recibido válido y bloquea confirmación cuando es insuficiente.
- cambio se deriva correctamente para efectivo exacto, excedente y pago mixto, sin emitir valores negativos.
- cambiar de efectivo a otro método limpia el efectivo recibido y elimina el bloque de cambio.

## E2E obligatorios

- venta de contado completa.
- venta de contado en efectivo: capturar monto exacto y confirmar con cambio `$0.00`.
- venta de contado en efectivo con excedente: mostrar y conservar el cambio correcto hasta recibir la confirmación del backend.
- efectivo insuficiente: mostrar validación y no invocar `SAL-06` ni la confirmación.
- venta a crédito con cliente.
- venta mixta si está habilitada.
- cancelación autorizada.
- conflicto o stock cambiado entre captura y confirmación.
- operación completa con teclado.

## Contrato Material y responsive

- Usar Angular Material/CDK para buscador, autocomplete, carrito, botones, overlays, pago y feedback.
- Escritorio: buscador + carrito + panel lateral de totales.
- Tableta: carrito principal y resumen colapsable/drawer.
- Móvil: una columna; buscador accesible, carrito en lista/cards y resumen/cobro mediante panel sticky o bottom sheet.
- La acción **Cobrar** nunca desaparece y no queda tapada por el teclado virtual.
- **Efectivo recibido**, su error y **Cambio a devolver** permanecen visibles, legibles y operables desde 320 px; el teclado numérico móvil no debe tapar la acción primaria ni el cambio.
- Cliente, descuentos, métodos de pago y confirmación conservan funcionalidad completa en móvil.
- Probar flujo táctil, teclado y escáner; no asumir que móvil carece de lector físico.
- No usar scroll horizontal global para simular la estación de escritorio.

## Reglas de implementación

- Crear rutas lazy.
- Consumir API mediante adapter y cliente generado.
- Usar Signals para estado de feature.
- Usar Reactive Forms tipados cuando exista captura.
- Implementar loading, vacío, error, éxito y forbidden.
- Aplicar permisos en rutas y acciones.
- No duplicar reglas autoritativas del backend.
- Agregar pruebas unitarias/componentes y E2E crítico.

## Contrato de entrega

```text
[ ] route/slice implementado
[ ] componentes Angular Material accesibles
[ ] comportamiento responsive móvil/tableta/escritorio validado
[ ] sin overflow horizontal global
[ ] store/facade implementado
[ ] adapter OpenAPI implementado
[ ] validaciones implementadas
[ ] permisos aplicados
[ ] errores y correlationId manejados
[ ] tests agregados
[ ] ng test pasa
[ ] ng build pasa
```

## Endpoints obligatorios y cobertura

Integrar las 21 operaciones `SAL-01..SAL-21` de `../06_MATRIZ_ENDPOINTS_FRONTEND.md`, incluidas facturación electrónica, receptor fiscal posterior, conciliación de cobertura y cancelación de cobro pendiente en terminal.

El workspace consume además `PRD-01`, `CUS-01`, `WHS-01`, `PMT-01` y `PTR-02` mediante contratos públicos. La terminal activa seleccionada se envía a `SAL-10`; la confirmación (`SAL-05`) y los pagos (`SAL-06`) nunca se reintentan automáticamente. Resumen e impresión usan `SAL-08` y `SAL-09`; no se reconstruye un comprobante autoritativo desde el carrito local.

## Composición mínima

- `sale-workspace`, `product-search`, `sale-cart`, `sale-line`;
- `customer-selector`, `sale-totals`, `payment-composer`, `sale-confirmation`;
- `sale-list`, `sale-detail`, `OperationResult`, `CancellationFlow`;
- `ui-button` para cobrar/confirmar con loading y prevención de doble click;
- `ui-money`, `ui-search-field`, `ui-status-chip`, `ui-action-bar` y estados compartidos.

La composición debe mantener una acción primaria inequívoca y permitir customizar labels/tonos/íconos desde contratos, sin ramas CSS por dispositivo o copia de componentes.
