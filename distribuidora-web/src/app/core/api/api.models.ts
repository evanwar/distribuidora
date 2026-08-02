import { HttpContext } from '@angular/common/http';

export interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
  errors?: string[] | null;
  correlationId?: string | null;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  query?: Readonly<Record<string, QueryValue>>;
  context?: HttpContext;
}
