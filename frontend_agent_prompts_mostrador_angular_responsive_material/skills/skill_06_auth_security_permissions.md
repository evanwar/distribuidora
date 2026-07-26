# Skill 06 - Autenticación, seguridad y permisos

## Principios

- Backend autoriza; frontend orienta.
- Access token de vida corta según contrato.
- Refresh seguro; no en localStorage.
- Interceptor de refresh coordinado.
- Guards funcionales y directiva/componente de permiso.
- No reintentar mutaciones automáticamente.
- Limpiar sesión y datos sensibles al logout.

## XSS y datos

- No usar `innerHTML` con contenido no confiable.
- No registrar tokens, contraseñas o datos sensibles.
- No incrustar secretos en environment.
- Sanitizar solo con APIs de Angular; no saltar seguridad sin ADR.
