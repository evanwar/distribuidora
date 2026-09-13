# Arquitectura de eventos en tiempo real

## Regla principal

SignalR transporta avisos de cambio, pero nunca decide el estado del negocio. PostgreSQL,
las transacciones de aplicación y las consultas a los proveedores externos son la fuente
de verdad. Después de recibir un evento, el cliente debe consultar el endpoint HTTP del
recurso antes de cambiar la interfaz a un estado definitivo.

## Flujo confiable

1. El caso de uso modifica el agregado y genera un `EntityChangedDomainEvent`.
2. `AppDbContext.SaveChangesAsync` guarda el cambio, el mensaje Outbox y el registro del
   evento en la misma transacción.
3. Después del commit, `OutboxWakeSignal` despierta al procesador. El escaneo periódico de
   recuperación permanece para reinicios o eventos creados por otra instancia.
4. `OutboxProcessor` entrega el evento a `IRealtimeEventPublisher`.
5. `SignalRRealtimeEventPublisher` lo publica en el canal autorizado correspondiente.
6. Sólo después de una entrega correcta se marca el mensaje Outbox como procesado. Una
   caída entre los pasos 5 y 6 puede duplicar el aviso; por eso `eventId` es idempotente.
7. Angular deduplica `eventId` y consulta HTTP. También consulta HTTP al conectar o
   reconectar, de modo que no depende de haber recibido todos los mensajes SignalR.

## Contrato del cliente

El Hub está disponible en `/hubs/realtime` y requiere JWT. El cliente llama a
`Subscribe(channel)`; el servidor comprueba el permiso antes de agregar la conexión al
grupo. Los mensajes se reciben en `domainEvent` con este contrato:

```json
{
  "eventId": "...",
  "channel": "sales",
  "eventName": "CounterSaleConfirmed",
  "entityName": "CounterSale",
  "entityId": "...",
  "occurredAt": "2026-08-11T12:00:00Z",
  "correlationId": "...",
  "operationId": "..."
}
```

`RealtimeService.watch(channel)` emite `null` al iniciar y después de cada reconexión.
`null` significa “recupera un snapshot mediante HTTP”. Un evento significa “el recurso
podría haber cambiado”; tampoco contiene datos autoritativos del negocio.

## Canales disponibles

| Canal | Permiso de suscripción | Flujos actuales o candidatos |
|---|---|---|
| `sales` | `sales.view` | Mercado Pago Point, pagos, confirmación y cancelación de ventas |
| `inventory` | `inventory.view` | existencias, ajustes, transferencias y disponibilidad del POS |
| `purchases` | `purchases.view` | confirmación de compras y cierre de recepciones |
| `receivables` | `receivables.view` | aplicación/cancelación de abonos y saldos de clientes |
| `catalogs` | `catalogs.view` | cambios de productos, clientes, proveedores y almacenes |
| `payment-terminals` | `admin.view_payment_terminals` | alta, edición, activación y disponibilidad de terminales |
| `invoicing` | `sales.view_billing_eligibility` | emisión, cancelación y conciliación de CFDI |
| `security` | `security.view` | desactivación de usuarios y cambios de acceso |
| `logs` | `logs.events.read` | errores y eventos operativos para consolas administrativas |

## Mercado Pago Point

El webhook firmado y `GET /api/v1/counter-sales/{id}/card-payment` comparten la misma
reconciliación idempotente. Cualquiera de los dos puede detectar una orden acreditada,
registrar el pago y confirmar la venta. La pantalla sólo muestra éxito después de volver
a obtener por HTTP el pago y la venta confirmada.

## Escalamiento

Una instancia funciona con SignalR local. Para varias instancias se debe configurar un
backplane (Redis en infraestructura propia) o Azure SignalR Service. El Outbox conserva
la entrega desde la base, y los clientes siempre recuperan snapshot al reconectar. Antes
de habilitar varias instancias del procesador se debe añadir reclamación de mensajes con
bloqueo `FOR UPDATE SKIP LOCKED` para evitar trabajo concurrente innecesario.

## Lista de comprobación para un evento nuevo

1. Generar el evento desde el agregado, no desde el controlador.
2. Mapear la entidad al canal en `RealtimeChannelCatalog`.
3. No incluir secretos ni datos personales en el evento.
4. Suscribirse mediante `RealtimeService.watch`.
5. Filtrar por `entityName` y `entityId`.
6. Recuperar el estado mediante HTTP antes de actualizar datos definitivos.
7. Probar evento duplicado, desconexión, reconexión y evento perdido.
