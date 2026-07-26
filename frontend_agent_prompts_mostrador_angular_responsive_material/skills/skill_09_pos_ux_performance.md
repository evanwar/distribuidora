# Skill 09 - UX y rendimiento del punto de venta

## Objetivo

Minimizar tiempo y errores de una venta.

## Reglas

- Search input con foco rápido y debounce solo para texto; código exacto puede resolver inmediato.
- Navegación por teclado.
- No bloquear la UI completa por requests secundarios.
- Virtualizar listas largas cuando sea necesario.
- Lazy load de features no críticas.
- No usar animaciones pesadas.
- Mantener borrador ante error recuperable.
- Confirmación idempotente o protegida contra duplicado.
- Medir tiempo desde escaneo hasta línea agregada y desde confirmar hasta respuesta.

## Presupuesto inicial sugerido

- carga inicial del shell pequeña;
- feature POS lazy pero precargable después de login;
- búsqueda cancelable;
- no descargar el catálogo completo.
