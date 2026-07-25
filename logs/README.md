# Paquete de especificación de logs backend

Este paquete contiene únicamente archivos Markdown relacionados con:

- actividad de usuario;
- auditoría de cambios;
- errores técnicos;
- Domain Events y Outbox;
- trazabilidad transaccional;
- identificadores de seguimiento;
- persistencia en PostgreSQL;
- consultas administrativas;
- seguridad, retención y pruebas.

## Orden recomendado de lectura

1. `00_ORQUESTADOR_LOGS.md`
2. `01_OBSERVABILIDAD_AUDITORIA_Y_LOGS_BD.md`
3. `02_TRAZABILIDAD_TRANSACCIONAL_E_IDENTIFICADORES.md`
4. `03_MODELO_DATOS_LOGS_POSTGRESQL.md`
5. `04_SKILL_LOGGING_AUDITORIA_ERRORES.md`
6. `05_CONSULTAS_Y_ENDPOINTS_TRAZABILIDAD.md`
7. `06_SEGURIDAD_RETENCION_Y_DATOS_SENSIBLES.md`
8. `07_PRUEBAS_Y_CRITERIOS_ACEPTACION_LOGS.md`

## Stack obligatorio

- .NET 8 o superior.
- ASP.NET Core Web API con Controllers MVC.
- Entity Framework Core Code First.
- PostgreSQL con Npgsql.
- Clean Architecture.
- Monolito modular.
- Vertical Slice.
- Domain Events.
- Outbox Pattern.
- OpenAPI/Swagger.
- Sin Minimal APIs.
