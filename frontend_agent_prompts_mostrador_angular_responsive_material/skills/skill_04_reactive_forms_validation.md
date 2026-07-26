# Skill 04 - Reactive Forms y validación

## Baseline

Usar Reactive Forms tipados y `NonNullableFormBuilder` cuando sea adecuado.

## Capas de validación

1. Formato inmediato en frontend.
2. Reglas autoritativas en backend.
3. Mapping de errores backend a controles.

## Reglas

- No duplicar cálculos de crédito, stock o totales como validación definitiva.
- Mostrar error al perder foco o intentar enviar.
- Mantener mensajes concretos y accionables.
- Prevenir submit doble.
- Confirmar antes de perder cambios importantes.
- Crear validadores compartidos solo para reglas transversales reales.
