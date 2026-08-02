import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OPERATION_STORAGE_PREFIX, OPERATION_TTL_MS } from './observability.constants';
import { withOperationId } from './observability-context';
import { TraceIdFactory } from './trace-id.factory';
import { OperationContext, OperationKind } from './trace.models';

@Injectable({ providedIn: 'root' })
export class OperationContextService {
  private readonly ids = inject(TraceIdFactory);

  start(kind: OperationKind, persistenceKey?: string): OperationContext {
    const operation = {
      operationId: this.ids.createOperationId(kind),
      kind,
      startedAt: Date.now(),
    };
    if (persistenceKey) this.write(persistenceKey, operation);
    return operation;
  }

  restoreOrStart(kind: OperationKind, persistenceKey: string): OperationContext {
    const restored = this.read(persistenceKey);
    return restored?.kind === kind ? restored : this.start(kind, persistenceKey);
  }

  toHttpContext(operation: OperationContext | string): HttpContext {
    return withOperationId(typeof operation === 'string' ? operation : operation.operationId);
  }

  complete(persistenceKey: string): void {
    try {
      sessionStorage.removeItem(this.storageKey(persistenceKey));
    } catch {
      // El almacenamiento puede estar deshabilitado; la trazabilidad HTTP sigue funcionando.
    }
  }

  private read(persistenceKey: string): OperationContext | null {
    try {
      const value = sessionStorage.getItem(this.storageKey(persistenceKey));
      if (!value) return null;
      const parsed = JSON.parse(value) as Partial<OperationContext>;
      const valid =
        this.ids.isValid(parsed.operationId) &&
        typeof parsed.startedAt === 'number' &&
        Date.now() - parsed.startedAt <= OPERATION_TTL_MS &&
        isOperationKind(parsed.kind);
      if (valid) return parsed as OperationContext;
      this.complete(persistenceKey);
    } catch {
      this.complete(persistenceKey);
    }
    return null;
  }

  private write(persistenceKey: string, operation: OperationContext): void {
    try {
      sessionStorage.setItem(this.storageKey(persistenceKey), JSON.stringify(operation));
    } catch {
      // No se persisten datos de negocio y el almacenamiento es opcional.
    }
  }

  private storageKey(persistenceKey: string): string {
    return `${OPERATION_STORAGE_PREFIX}${encodeURIComponent(persistenceKey)}`;
  }
}

function isOperationKind(value: unknown): value is OperationKind {
  return ['POS', 'INV', 'PUR', 'AR', 'ADM', 'WEB'].includes(String(value));
}
