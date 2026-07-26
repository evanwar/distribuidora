# Skill 05 - OpenAPI y contratos backend

## Flujo

- Obtener OpenAPI del backend compilado.
- Generar cliente compatible con Angular fijado.
- No editar generated.
- Crear adapter por feature.
- Mapear DTO a ViewModel.
- Detectar breaking changes en CI.
- Asignar cada operación a un ID y estado en `06_MATRIZ_ENDPOINTS_FRONTEND.md`.
- Verificar que las 109 operaciones sigan clasificadas después de regenerar.

## Prohibido

- Inventar endpoints.
- Copiar manualmente interfaces del backend.
- Usar URLs hardcodeadas en componentes.
- Depender de nombres de campos no presentes en contrato.
- Declarar integrado un endpoint que solo existe en generated y no tiene consumidor/prueba.

## Cuando falta una operación

Generar un Gap Report y bloquear el slice afectado. No simular la regla en frontend.
