export type OperationKind = 'POS' | 'INV' | 'PUR' | 'AR' | 'ADM' | 'WEB';

export interface OperationContext {
  readonly operationId: string;
  readonly kind: OperationKind;
  readonly startedAt: number;
}

export interface ResponseTrace {
  readonly correlationId: string;
  readonly operationId: string;
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly capturedAt: number;
}
