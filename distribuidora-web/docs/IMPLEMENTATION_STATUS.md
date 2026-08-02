# Estado de implementación del orquestador

## Base transversal

- Angular 21 standalone, strict y lazy routing.
- Angular Material 3/CDK con tema, tokens y tipografía centralizados.
- Shell responsive, login, guards, sesión en memoria, refresh e interceptores.
- Errores normalizados con `correlationId`.
- Componentes configurables para botones, encabezados, barras de acciones, estados, alertas, dinero, fecha y vistas responsive.
- Snapshot OpenAPI y cliente generado: 59 modelos y 31 servicios.
- Catálogo validado: 111 operaciones únicas.

## Seguridad y catálogos

- Login, refresh y logout usan el cliente OpenAPI generado.
- Usuarios, roles y permisos se administran desde tareas guiadas en `/operations/security`.
- Clientes y proveedores cuentan con búsqueda, alta y edición.
- Productos usa selectores remotos para categoría, marca y unidad, y recupera el detalle antes de editar.
- Categorías, marcas, unidades, almacenes y aliases usan el patrón acotado de maestros.

## Operación

- Punto de venta especializado:
  - búsqueda por nombre, SKU o código de barras;
  - carrito y cantidades;
  - almacén, cliente y condición de pago;
  - cobro, borrador y confirmación;
  - historial, reanudación, pagos, cancelación y comprobante imprimible.
- Inventario, compras, recepciones, cobranza, auditoría, reportes y administración usan workspaces de negocio.
- Los workspaces agrupan las tareas por tema, generan formularios guiados, soportan partidas repetibles y presentan resultados legibles.
- Las rutas HTTP, IDs técnicos de operación y editores JSON ya no se exponen en la interfaz principal.
- Las 111 operaciones continúan cubiertas entre autenticación, catálogos, POS y workspaces.

## Integración Docker

- PostgreSQL conserva sus datos en el volumen `distribuidora_postgres_data`.
- `SEED_SYNC_ADMIN_CREDENTIALS=true` permite que el administrador semilla tome la contraseña actual de `.env` aunque la base ya exista.
- El catálogo de métodos de pago puede consultarse desde ventas y cobranza; su mantenimiento sigue protegido por permisos administrativos.
- Este entorno de Codex no dispone del ejecutable Docker, por lo que el rebuild del contenedor debe ejecutarse desde Docker Desktop o una terminal con Docker.

## Gates ejecutados

```text
Angular build de producción: aprobado, sin warnings de presupuesto
Angular ESLint: aprobado
Vitest: 4/4
Playwright móvil/tableta/escritorio: 9/9
.NET unit tests: 17/17
.NET integration tests: 5/5
OpenAPI: 111 operaciones, 59 modelos, 31 servicios
```
