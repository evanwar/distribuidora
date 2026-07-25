# Seguridad, retención y datos sensibles en logs

## Principio

Los logs pueden contener información sensible y deben tratarse como datos protegidos.

## Datos prohibidos

Nunca almacenar:

```text
contraseñas
hashes de contraseña
JWT
refresh tokens
cookies completas
Authorization header
connection strings
API keys
secretos
CVV
datos bancarios completos
documentos completos cargados por el usuario
cuerpos HTTP completos por defecto
```

## Datos permitidos con sanitización

```text
identificador de usuario
correo parcialmente enmascarado
IP según política
user agent
ruta
método
código HTTP
identificador de entidad
folio
cantidades
totales de negocio cuando estén autorizados
before/after limitado a propiedades permitidas
```

## Estrategia del sanitizador

Deny-by-default:

1. definir campos permitidos;
2. eliminar campos desconocidos sensibles;
3. truncar strings;
4. limitar profundidad JSON;
5. limitar tamaño máximo;
6. enmascarar identificadores cuando aplique;
7. evitar serializar entidades EF completas.

## Acceso

- Todos los endpoints requieren autenticación.
- Los errores técnicos requieren permiso especial.
- `stackTrace` solo se devuelve a perfiles técnicos autorizados.
- Toda consulta y exportación queda registrada.
- No permitir edición de logs.
- Solo permitir marcar errores como resueltos o reabiertos.

## Integridad

Los logs de auditoría deben ser append-only.

No implementar:

```text
PUT audit log
DELETE audit log
edición de before/after
cambio de usuario actor
```

La resolución de un error se registra en campos separados y debe generar auditoría.

## Retención sugerida

La política final depende del negocio y legislación aplicable.

Baseline técnico:

```text
UserActivityLog: 12 a 24 meses
AuditLog crítico: 5 años o según política
SystemErrorLog: 12 a 24 meses
SystemEventLog: 6 a 12 meses después del procesamiento
```

No ejecutar borrado físico sin:

- política aprobada;
- job auditado;
- respaldo;
- filtros por fecha y estado;
- registro de cantidad eliminada;
- permiso administrativo.

## Particionamiento

Evaluar particionamiento mensual por `occurred_at` cuando:

- el volumen supere millones de filas;
- las consultas por fecha sean predominantes;
- la retención requiera eliminación eficiente.

No introducir particionamiento en el MVP sin evidencia de volumen.

## Cifrado

- TLS para conexiones.
- Secretos fuera del repositorio.
- Backups cifrados.
- Cifrado de disco administrado por la plataforma.
- Campos adicionales cifrados solo cuando exista una necesidad explícita.

## Inyección de logs

Sanitizar saltos de línea y caracteres de control en:

```text
user agent
request path
mensajes externos
referencias
motivos capturados por usuario
```

## Stack traces

Guardar stack trace completo solo en PostgreSQL y bajo acceso restringido.

La API pública debe devolver únicamente:

```text
errorCode
correlationId
operationId
mensaje genérico
```
