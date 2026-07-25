---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# WF02 - Pruebas y criterios de aceptación

## Antes de iniciar un módulo

- Leer orquestador.
- Leer skills obligatorias.
- Confirmar dependencias.
- Revisar que el módulo no introduce procesos fuera del alcance.

## Al terminar un módulo

Ejecutar:

```bash
dotnet build
dotnet test
```

Aplicar migración en ambiente local:

```bash
dotnet ef database update --project src/Distribuidora.Infrastructure --startup-project src/Distribuidora.Api
```

## Criterios mínimos por módulo

- Compila.
- Tiene migración.
- Tiene endpoints Swagger.
- Tiene validadores.
- Tiene permisos.
- Tiene auditoría en operaciones críticas.
- Tiene pruebas.
- No modifica stock directamente.
- No crea dependencias fuera del alcance.

## Pruebas end-to-end mínimas

1. Crear producto.
2. Registrar recepción.
3. Ver stock.
4. Crear venta mostrador.
5. Confirmar venta.
6. Ver stock descontado.
7. Registrar pago.
8. Cancelar venta.
9. Ver movimiento inverso.
10. Consultar kardex y auditoría.
