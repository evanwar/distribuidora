# Skill 01 - Arquitectura Angular

## Objetivo

Mantener una SPA Angular coherente y actualizable.

## Aplicar siempre

- Componentes standalone.
- Bootstrap con providers.
- Rutas lazy.
- `core` transversal, `shared` sin negocio y `features` aisladas.
- No importar internals entre features.
- No crear servicios globales para todo.
- Separar pages/container de componentes presentacionales.
- Crear las primitivas F0 de `07_ARQUITECTURA_COMPONENTES_UX.md`; promover patrones de dominio solo con reutilización comprobada.
- Registrar decisiones mayores con ADR.

## Evitar

- `SharedModule` gigante.
- carpetas globales de `services` o `models` sin dueño.
- barrels que oculten ciclos.
- componentes de miles de líneas.
- arquitectura basada únicamente en tipo de archivo.
- páginas que mezclan HTTP, estado, reglas y detalle visual.
- carpetas genéricas `catalogs` como único ownership de clientes, proveedores o productos.
