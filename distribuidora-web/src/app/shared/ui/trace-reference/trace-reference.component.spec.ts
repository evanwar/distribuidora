import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TraceReferenceComponent } from './trace-reference.component';

describe('TraceReferenceComponent', () => {
  let fixture: ComponentFixture<TraceReferenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraceReferenceComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(TraceReferenceComponent);
    fixture.componentRef.setInput('correlationId', 'WEB-correlation-1');
    fixture.componentRef.setInput('operationId', 'POS-operation-1');
  });

  it('copies both identifiers as a support reference', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await fixture.componentInstance.copy();

    expect(writeText).toHaveBeenCalledWith(
      'Correlation ID: WEB-correlation-1\nOperation ID: POS-operation-1',
    );
    expect(fixture.componentInstance.copied()).toBe(true);
  });
});
