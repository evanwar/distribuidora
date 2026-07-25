---
project: Distribuidora Backend - MVP Mostrador
stack: ASP.NET Core Web API, .NET 8+, EF Core, PostgreSQL, Npgsql, OpenAPI/Swagger
architecture: Modular Monolith + Clean Architecture + Vertical Slice + Domain Events
scope: Backend only, ventas por mostrador, sin rutas ni camiones
---

# Skill 04 - EF Core + PostgreSQL Code First

## Objetivo

Implementar persistencia limpia con EF Core, Npgsql y migraciones Code First.

## Paquetes sugeridos

```text
Npgsql.EntityFrameworkCore.PostgreSQL
Microsoft.EntityFrameworkCore.Design
Microsoft.EntityFrameworkCore.Tools
```

## Convenciones PostgreSQL

- `numeric(18,2)` para dinero.
- `numeric(18,4)` para cantidades.
- `timestamptz` para fechas auditables.
- Índices únicos en folios, SKU, código de barras y claves naturales.
- Usar snake_case si se configura una convención global.

## Configuraciones

Cada entidad debe tener configuración:

```csharp
public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products", "catalogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Sku).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Sku).IsUnique();
    }
}
```

## Migraciones

- Una migración por módulo o bloque coherente.
- Revisar SQL generado antes de aplicar a producción.
- Seeds mínimos para permisos, roles, métodos de pago y configuración base.

## Concurrencia

Usar token de concurrencia en:

- `StockBalance`.
- Documentos operativos confirmables.
- Configuraciones críticas.

## Prohibición

No hacer `context.Database.EnsureCreated()` en producción. Usar migraciones.
