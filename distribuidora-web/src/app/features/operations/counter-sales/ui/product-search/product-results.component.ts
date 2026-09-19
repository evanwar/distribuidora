import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UiButtonComponent } from '../../../../../shared/ui/button/ui-button.component';
import { UiIconComponent } from '../../../../../shared/ui/icon/ui-icon.component';
import { SearchProduct } from '../../models/product-search.models';
import { ProductMatchPipe } from './product-match.pipe';

@Component({
  selector: 'app-product-results',
  imports: [CurrencyPipe, DecimalPipe, MatButtonModule, MatTooltipModule, UiButtonComponent, UiIconComponent, ProductMatchPipe],
  template: `
    <div class="results" [class.grid-view]="view() === 'grid'">
      @for (product of products(); track product.id) {
        <article class="product-row" [class.product-row--empty]="product.availableStock <= 0"
          [class.product-row--low]="isLowStock(product)" tabindex="0" [attr.aria-label]="product.name"
          (keydown)="quantityKey($event, product)">
          <div class="identity">
            <strong>@for (part of product.name | productMatch: query(); track $index) {
              @if (part.match) { <mark>{{ part.text }}</mark> } @else { {{ part.text }} }
            }</strong>
            <small>{{ product.sku }} · {{ product.brandName }}</small>
          </div>
          <span class="stock" [class.stock--low]="isLowStock(product)" [class.stock--empty]="product.availableStock <= 0">
            <span class="stock-dot" aria-hidden="true"></span>
            @if (product.availableStock <= 0) { Sin existencia }
            @else if (isLowStock(product)) { Poco stock · {{ product.availableStock | number: '1.0-4' }} }
            @else { Disponible · {{ product.availableStock | number: '1.0-4' }} }
          </span>
          <strong class="price">{{ product.price | currency: 'MXN' }}</strong>
          <div class="actions">
            @if (quantities()[product.id]) { <small>{{ quantities()[product.id] }} en venta</small> }
            <app-ui-button label="Agregar" icon="add" size="compact"
              [disabled]="!canAdd(product)" [ariaLabel]="'Agregar una unidad de ' + product.name"
              (pressed)="add.emit(product)" />
            <button matIconButton type="button" class="favorite-button"
              [class.favorite-button--active]="product.favorite"
              [matTooltip]="product.favorite ? 'Quitar favorito' : 'Marcar favorito'"
              [attr.aria-label]="(product.favorite ? 'Quitar favorito ' : 'Marcar favorito ') + product.name"
              [attr.aria-pressed]="product.favorite" [disabled]="favoriteBusy() === product.id"
              (click)="favorite.emit(product)">
              <app-ui-icon name="favorite" />
            </button>
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

  protected isLowStock(product: SearchProduct) {
    return product.availableStock > 0 && product.minimumStock > 0 && product.availableStock <= product.minimumStock;
  }

  protected canAdd(product: SearchProduct) {
    return !this.busy() && product.availableStock > 0 && (this.quantities()[product.id] || 0) + 1 <= product.availableStock;
  }

  protected quantityKey(event: KeyboardEvent, product: SearchProduct) {
    if (event.target !== event.currentTarget) return;
    if ((event.key === 'Enter' || event.key === '+') && this.canAdd(product)) {
      event.preventDefault(); this.add.emit(product);
    } else if (event.key === '-' && !this.busy()) {
      event.preventDefault(); this.decrease.emit(product);
    }
  }
}
