export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'rate-limit'
  | 'network'
  | 'server'
  | 'unexpected';

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  fieldErrors: Readonly<Record<string, string[]>>;
  status: number;
  correlationId?: string;
  retryable: boolean;
}
