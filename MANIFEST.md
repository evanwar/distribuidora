---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Manifest del paquete

## Archivos transversales

| Archivo | Propósito |
|---|---|
| `00_ORQUESTADOR.md` | Prompt maestro para coordinar agentes y orden de implementación. |
| `01_CONTEXTO_NEGOCIO_Y_ALCANCE.md` | Alcance funcional del MVP enfocado a mostrador. |
| `02_ARQUITECTURA_GLOBAL.md` | Estructura de solución, dependencias y patrones. |
| `03_CONVENCIONES_TRANSVERSALES.md` | Reglas globales de API, auditoría, estados y persistencia. |

## Módulos activos

| Módulo | Archivo | Estado |
|---|---|---|
| M01 | `modules/M01_seguridad_usuarios_permisos.md` | Activo |
| M02 | `modules/M02_catalogos_base_mostrador.md` | Activo |
| M03 | `modules/M03_inventario_existencias_kardex.md` | Activo |
| M04 | `modules/M04_compras_recepcion_mercancia.md` | Activo |
| M05 | `modules/M05_ventas_por_mostrador.md` | Activo |
| M06 | `modules/M06_cobranza_cuentas_por_cobrar.md` | Activo si se permitirá crédito |
| M07 | `modules/M07_auditoria_ajustes_cancelaciones.md` | Activo |
| M08 | `modules/M08_reportes_dashboard_mostrador.md` | Activo |
| M09 | `modules/M09_administracion_configuracion.md` | Activo |

## Módulos removidos del alcance actual

No generar código, entidades, endpoints, migraciones ni pruebas para:

- Almacenes móviles.
- Cargas de distribución.
- Liquidación de personal de reparto.
- Seguimiento operativo de unidades.
- GPS.
- App móvil de reparto.

## Skills reutilizables

```text
skills/skill_01_clean_architecture.md
skills/skill_02_vertical_slice.md
skills/skill_03_domain_events.md
skills/skill_04_efcore_postgresql_codefirst.md
skills/skill_05_api_validation_security.md
skills/skill_06_testing_acceptance.md
skills/skill_07_inventory_consistency.md
skills/skill_08_counter_sales_consistency.md
```

## Workflows

```text
workflows/WF01_flujo_operativo_mostrador.md
workflows/WF02_pruebas_criterios_aceptacion.md
workflows/WF03_orden_de_implementacion_para_agentes.md
```
