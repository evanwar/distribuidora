# ADR-001 - Generador OpenAPI Angular sin Java

## Estado

Aceptado.

## Contexto

El contrato autoritativo es Swagger/OpenAPI 3.0.1 publicado por `Distribuidora.Api`. El plan proponía OpenAPI Generator con `typescript-angular`, pero el entorno de desarrollo no dispone de Java y el CLI no puede ejecutarse.

## Decisión

Usar `ng-openapi-gen` para generar modelos, funciones y servicios Angular desde `openapi/distribuidora.v1.json`.

El código se genera en `src/app/core/api/generated` y no se edita manualmente. Los adapters de feature siguen aislando al resto de la aplicación del código generado.

## Consecuencias

- La generación funciona únicamente con Node y npm.
- Se conservan tipos, nulabilidad, rutas y parámetros del OpenAPI real.
- Un cambio de generador requiere nueva ADR y validación de los adapters.
- `npm run api:generate` debe ejecutarse después de actualizar el snapshot OpenAPI.

## Reversión

Instalar un JRE compatible, restaurar el comando de OpenAPI Generator y regenerar en una rama separada para comparar contratos antes de sustituir el cliente.
