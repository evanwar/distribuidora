import { HttpContext, HttpContextToken } from '@angular/common/http';

export const OPERATION_ID_CONTEXT = new HttpContextToken<string | null>(() => null);

export function withOperationId(operationId: string): HttpContext {
  return new HttpContext().set(OPERATION_ID_CONTEXT, operationId);
}
