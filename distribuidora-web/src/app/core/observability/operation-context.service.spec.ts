import { TestBed } from '@angular/core/testing';
import { OperationContextService } from './operation-context.service';
import { OPERATION_ID_CONTEXT } from './observability-context';

describe('OperationContextService', () => {
  beforeEach(() => sessionStorage.clear());

  it('restores the same operation for an active business flow', () => {
    const service = TestBed.inject(OperationContextService);
    const first = service.restoreOrStart('POS', 'sale-1');
    const restored = service.restoreOrStart('POS', 'sale-1');

    expect(restored.operationId).toBe(first.operationId);
    expect(restored.operationId).toMatch(/^POS-/);
    expect(service.toHttpContext(restored).get(OPERATION_ID_CONTEXT)).toBe(first.operationId);
  });

  it('starts a new operation after the previous one is completed', () => {
    const service = TestBed.inject(OperationContextService);
    const first = service.restoreOrStart('INV', 'adjustment-1');
    service.complete('adjustment-1');

    expect(service.restoreOrStart('INV', 'adjustment-1').operationId).not.toBe(first.operationId);
  });
});
