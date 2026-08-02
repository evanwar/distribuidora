export const CORRELATION_ID_HEADER = 'X-Correlation-ID';
export const OPERATION_ID_HEADER = 'X-Operation-ID';

export const TRACE_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
export const OPERATION_STORAGE_PREFIX = 'distribuidora.observability.operation.v1.';
export const OPERATION_TTL_MS = 8 * 60 * 60 * 1000;
