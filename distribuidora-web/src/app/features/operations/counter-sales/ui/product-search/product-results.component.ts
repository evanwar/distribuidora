import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiIconButtonComponent } from '../../../../../shared/ui/button/ui-icon-button.component';
import { UiButtonComponent } from '../../../../../shared/ui/button/ui-button.component';
import { UiIconComponent } from '../../../../../shared/ui/icon/ui-icon.component';
import { SearchProduct } from '../../models/product-search.models';
import { ProductMatchPipe } from './product-match.pipe';

@Component({
  selector: 'app-product-results',
  imports: [CurrencyPipe, DecimalPipe, UiIconButtonComponent, UiButtonComponent, UiIconComponent, ProductMatchPipe],
  template: `
    <div class="results" [class.grid]="view() === 'grid'">
      @for (product of products(); track product.id) {
        <article class="product-row" tabindex="0" [attr.aria-label]="product.name" (keydown)="quantityKey($event, product)">
          <app-ui-icon class="product-image" name="products" />
          <div class="identity">
            <strong>@for (part of product.name | productMatch: query(); track $index) {
              @if (part.match) { <mark>{{ part.text }}</mark> } @else { {{ part.text }} }
            }</strong>
            <small>{{ product.sku }} · {{ product.brandName }}</small>
          </div>
          <span class="stock" [class.low]="product.availableStock <= product.minimumStock">
            @if (product.availableStock <= 0) { Sin existencia }
            @else { @if (product.availableStock <= product.minimumStock) { ⚠ Bajo: }
              {{ product.availableStock | number: '1.0-4' }} disp. }
          </span>
          <strong class="price">{{ product.price | currency: 'MXN' }}</strong>
          <div class="actions">
            @if (quantities()[product.id]) { <small>{{ quantities()[product.id] }} en venta</small> }
            <app-ui-icon-button icon="add" [ariaLabel]="'Agregar una unidad de ' + product.name"
              [disabled]="busy() || (quantities()[product.id] || 0) + 1 > product.availableStock"
              (pressed)="add.emit(product)" />
            <app-ui-button [label]="product.favorite ? '★' : '☆'" variant="text"
              [ariaLabel]="(product.favorite ? 'Quitar favorito ' : 'Marcar favorito ') + product.name"
              [loading]="favoriteBusy() === product.id" (pressed)="favorite.emit(product)" />
          </div>
        </article>
      }
    </div>
  `,
  styleUrl: './product-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductResultsComponent {
  readonly products = input<readonly SearchProduct[]>([]);
  readonly query = input('');
  readonly view = input<'list' | 'grid'>('list');
  readonly quantities = input<Record<string, number>>({});
  readonly busy = input(false);
  readonly favoriteBusy = input<string | null>(null);
  readonly add = output<SearchProduct>();
  readonly favorite = output<SearchProduct>();
  readonly decrease = output<SearchProduct>();
  protected quantityKey(event: KeyboardEvent, product: SearchProduct) {
    if (event.key === '+' && !this.busy() && (this.quantities()[product.id] || 0) + 1 <= product.availableStock) {
      event.preventDefault(); this.add.emit(product);
    } else if (event.key === '-' && !this.busy()) { event.preventDefault(); this.decrease.emit(product); }
  }
}
