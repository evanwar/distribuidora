import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDateFieldComponent } from './ui-date-field.component';

describe('UiDateFieldComponent', () => {
  let fixture: ComponentFixture<UiDateFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiDateFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiDateFieldComponent);
    fixture.componentRef.setInput('label', 'Desde');
    fixture.detectChanges();
  });

  it('renders an accessible calendar toggle', () => {
    const toggle = (fixture.nativeElement as HTMLElement).querySelector('mat-datepicker-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute('aria-label')).toBe('Abrir calendario para Desde');
  });

  it('opens the calendar from its toggle', async () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'mat-datepicker-toggle button',
    );

    button?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.querySelector('mat-calendar')).not.toBeNull();
  });

  it('keeps the form contract in ISO format', () => {
    let emittedValue = '';
    fixture.componentInstance.registerOnChange((value) => (emittedValue = value));

    fixture.componentInstance.dateControl.setValue(new Date(2026, 7, 5));

    expect(emittedValue).toBe('2026-08-05');
  });

  it('accepts an ISO value from the form', () => {
    fixture.componentInstance.writeValue('2026-08-05');

    const value = fixture.componentInstance.dateControl.value;
    expect(value?.getFullYear()).toBe(2026);
    expect(value?.getMonth()).toBe(7);
    expect(value?.getDate()).toBe(5);
  });
});
