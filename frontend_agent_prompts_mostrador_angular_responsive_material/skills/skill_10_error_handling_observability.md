# Skill 10 - Errores y observabilidad

## Error model

Normalizar errores a:

```text
kind
message
fieldErrors
status
correlationId
retryable
```

## Reglas

- Error interceptor normaliza, no decide UX específica de cada feature.
- Store/page decide mensaje y recuperación.
- Registrar telemetría sin PII ni tokens.
- Conservar correlationId.
- Distinguir offline, timeout, 409, 422, 403 y 500.
- No ocultar errores con `EMPTY`.
- Retry automático solo en consultas idempotentes y con límite.
