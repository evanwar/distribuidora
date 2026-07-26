import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './ui-button.component';

describe('UiButtonComponent', () => {
  let fixture: ComponentFixture<UiButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UiButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(UiButtonComponent);
    fixture.componentRef.setInput('label', 'Guardar cliente');
    fixture.detectChanges();
  });

  it('renders the configured label', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Guardar cliente');
  });

  it('blocks interaction while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-busy')).toBe('true');
  });
});
