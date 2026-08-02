import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductTileComponent } from './product-tile.component';

describe('ProductTileComponent', () => {
  let fixture: ComponentFixture<ProductTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductTileComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProductTileComponent);
    fixture.componentRef.setInput('product', {
      id: 'product-1',
      sku: 'ARZ-001',
      name: 'Arroz premium',
      barcode: '750000000001',
      price: 45.5,
    });
    fixture.componentRef.setInput('available', 12);
    fixture.componentRef.setInput('canAdd', true);
    fixture.detectChanges();
  });

  it('presents product, stock and price with an accessible action', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Arroz premium');
    expect(element.textContent).toContain('12 disponibles');
    expect(element.textContent).toContain('$45.50');
    expect(element.querySelector('button')?.getAttribute('aria-label')).toContain(
      'Agregar una unidad de Arroz premium',
    );
  });

  it('emits the add intention', () => {
    let additions = 0;
    fixture.componentInstance.add.subscribe(() => additions++);
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    expect(additions).toBe(1);
  });

  it('offers and emits the add-all intention', () => {
    let additions = 0;
    fixture.componentInstance.addAll.subscribe(() => additions++);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');

    expect(buttons[1]?.textContent).toContain('Agregar todos');
    expect(buttons[1]?.getAttribute('aria-label')).toContain(
      'Agregar toda la existencia disponible de Arroz premium: 12 unidades',
    );
    buttons[1]?.click();

    expect(additions).toBe(1);
  });

  it('communicates and blocks the maximum state', () => {
    fixture.componentRef.setInput('canAdd', false);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('Máximo agregado');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button')).toHaveLength(1);
  });
});
