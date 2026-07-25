# Modelo de datos para logs en PostgreSQL

## Schema

Usar:

```sql
CREATE SCHEMA IF NOT EXISTS audit;
```

Las migraciones deben generarse con EF Core Code First.

## `audit.user_activity_logs`

Campos mínimos:

```text
id uuid/ulid PK
occurred_at timestamptz NOT NULL
completed_at timestamptz nullable
user_id uuid nullable
actor_identifier varchar(200) nullable
session_id varchar(200) nullable
activity_type varchar(100) NOT NULL
module varchar(100) NOT NULL
action varchar(150) NOT NULL
http_method varchar(10) nullable
route_template varchar(300) nullable
request_path varchar(500) nullable
response_status_code integer nullable
duration_ms bigint nullable
ip_address inet nullable
user_agent varchar(1000) nullable
correlation_id varchar(100) NOT NULL
operation_id varchar(100) NOT NULL
trace_id varchar(100) nullable
request_id varchar(100) nullable
reference_type varchar(100) nullable
reference_id varchar(100) nullable
reference_folio varchar(100) nullable
entity_name varchar(150) nullable
entity_id varchar(100) nullable
request_summary jsonb nullable
result_summary jsonb nullable
succeeded boolean NOT NULL
failure_code varchar(150) nullable
```

## `audit.audit_logs`

```text
id uuid/ulid PK
occurred_at timestamptz NOT NULL
user_id uuid nullable
actor_identifier varchar(200) nullable
module varchar(100) NOT NULL
action varchar(150) NOT NULL
entity_name varchar(150) NOT NULL
entity_id varchar(100) NOT NULL
reference_type varchar(100) nullable
reference_id varchar(100) nullable
reference_folio varchar(100) nullable
before_data jsonb nullable
after_data jsonb nullable
changed_properties jsonb nullable
reason varchar(1000) nullable
ip_address inet nullable
correlation_id varchar(100) NOT NULL
operation_id varchar(100) NOT NULL
trace_id varchar(100) nullable
transaction_id varchar(100) NOT NULL
event_id varchar(100) nullable
causation_id varchar(100) nullable
```

## `audit.system_error_logs`

```text
id uuid/ulid PK
occurred_at timestamptz NOT NULL
severity varchar(30) NOT NULL
error_code varchar(150) nullable
exception_type varchar(500) NOT NULL
message text NOT NULL
stack_trace text nullable
inner_exception jsonb nullable
source varchar(500) nullable
module varchar(100) nullable
handler_name varchar(300) nullable
controller_name varchar(200) nullable
http_method varchar(10) nullable
request_path varchar(500) nullable
response_status_code integer nullable
user_id uuid nullable
actor_identifier varchar(200) nullable
ip_address inet nullable
correlation_id varchar(100) NOT NULL
operation_id varchar(100) NOT NULL
trace_id varchar(100) nullable
request_id varchar(100) nullable
transaction_id varchar(100) nullable
event_id varchar(100) nullable
causation_id varchar(100) nullable
reference_type varchar(100) nullable
reference_id varchar(100) nullable
reference_folio varchar(100) nullable
environment varchar(50) NOT NULL
application_version varchar(100) nullable
host_name varchar(200) nullable
context_data jsonb nullable
is_resolved boolean NOT NULL DEFAULT false
resolved_at timestamptz nullable
resolved_by uuid nullable
resolution_notes varchar(2000) nullable
occurrence_count integer NOT NULL DEFAULT 1
fingerprint varchar(128) nullable
```

## `audit.system_event_logs`

```text
id uuid/ulid PK
event_id varchar(100) NOT NULL
event_name varchar(300) NOT NULL
aggregate_type varchar(200) nullable
aggregate_id varchar(100) nullable
payload jsonb NOT NULL
status varchar(30) NOT NULL
attempt_count integer NOT NULL DEFAULT 0
created_at timestamptz NOT NULL
processed_at timestamptz nullable
last_attempt_at timestamptz nullable
next_attempt_at timestamptz nullable
last_error text nullable
correlation_id varchar(100) NOT NULL
operation_id varchar(100) NOT NULL
trace_id varchar(100) nullable
transaction_id varchar(100) nullable
causation_id varchar(100) nullable
reference_type varchar(100) nullable
reference_id varchar(100) nullable
reference_folio varchar(100) nullable
```

## Índices mínimos

```text
user_activity_logs(occurred_at desc)
user_activity_logs(user_id, occurred_at desc)
user_activity_logs(correlation_id)
user_activity_logs(operation_id)
user_activity_logs(reference_folio)
user_activity_logs(module, action, occurred_at desc)

audit_logs(entity_name, entity_id, occurred_at desc)
audit_logs(user_id, occurred_at desc)
audit_logs(correlation_id)
audit_logs(operation_id)
audit_logs(transaction_id)
audit_logs(reference_folio)

system_error_logs(occurred_at desc)
system_error_logs(correlation_id)
system_error_logs(operation_id)
system_error_logs(fingerprint, occurred_at desc)
system_error_logs(is_resolved, severity, occurred_at desc)
system_error_logs(reference_folio)
system_error_logs(event_id)

system_event_logs(event_id) UNIQUE
system_event_logs(operation_id)
system_event_logs(correlation_id)
system_event_logs(causation_id)
system_event_logs(status, next_attempt_at)
system_event_logs(reference_folio)
```

## Restricciones

```text
operation_id NOT NULL
correlation_id NOT NULL
transaction_id NOT NULL en audit_logs
event_id UNIQUE en system_event_logs
duration_ms >= 0
occurrence_count >= 1
attempt_count >= 0
```

## Tipos EF Core

Recomendaciones:

```text
DateTimeOffset -> timestamptz
IPAddress/string -> inet o varchar según la abstracción elegida
Dictionary<string, object> serializado -> jsonb
ULID -> conversión a uuid o varchar(26)
Enums -> varchar con conversión explícita
```

## Separación de DbContext

### `AppDbContext`

Contiene:

- datos de negocio;
- inventario;
- ventas;
- compras;
- pagos;
- `AuditLog` cuando deba participar en la transacción principal;
- Outbox.

### `LoggingDbContext`

Contiene:

- `UserActivityLog`;
- `SystemErrorLog`;
- registros técnicos que deban sobrevivir al rollback;
- consulta administrativa de logs.

Puede apuntar a la misma base PostgreSQL, pero usar conexión y scope independientes.

## Migraciones sugeridas

```text
AddAuditSchema
AddUserActivityLogs
AddBusinessAuditLogs
AddSystemErrorLogs
AddSystemEventLogs
AddOperationAndCausationIdentifiers
AddLoggingIndexes
```

No crear tablas manualmente fuera de migraciones salvo scripts de recuperación documentados.
