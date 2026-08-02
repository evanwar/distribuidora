import { Injectable, signal } from '@angular/core';
import { ResponseTrace } from './trace.models';

@Injectable({ providedIn: 'root' })
export class ResponseTraceService {
  private readonly lastTraceState = signal<ResponseTrace | null>(null);
  readonly lastTrace = this.lastTraceState.asReadonly();

  capture(trace: ResponseTrace): void {
    this.lastTraceState.set(trace);
  }
}
