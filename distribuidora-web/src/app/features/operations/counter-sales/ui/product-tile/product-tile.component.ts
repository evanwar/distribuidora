import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UiButtonComponent } from '../../../../../shared/ui/button/ui-button.component';
import { PosProduct } from '../../models/counter-sale.models';

@Component({
  selector: 'app-product-tile',
  imports: [CurrencyPipe, DecimalPipe, MatCardModule, UiButtonComponent],
  template: `
    <mat-card
      appearance="outlined"
      class="product-tile"
      [class.product-tile--unavailable]="available() === 0"
    >
      <div class="product-tile__header">
        <span class="product-tile__visual" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21" />
          </svg>
        </span>
        <span class="product-tile__sku">{{ product().sku || 'SIN SKU' }}</span>
      </div>

      <mat-card-content>
        <h3 [attr.title]="product().name">{{ product().name }}</h3>
        <div
          class="product-tile__stock"
          [class.product-tile__stock--empty]="available() === 0"
        >
          <span class="product-tile__stock-dot" aria-hidden="true"></span>
          @if (available() === 0) {
            <span>Sin existencia</span>
          } @else {
            <span><strong>{{ available() | number: '1.0-4' }}</strong> disponibles</span>
          }
        </div>
      </mat-card-content>

      <mat-card-actions>
        <div class="product-tile__price">
          <span>Precio</span>
          <strong>{{ product().price | currency: 'MXN' }}</strong>
        </div>
        <div class="product-tile__actions" [class.product-tile__actions--complete]="!canAdd()">
          @if (canAdd()) {
            <app-ui-button
              label="Agregar"
              icon="add"
              size="compact"
              [ariaLabel]="'Agregar una unidad de ' + product().name"
              (pressed)="add.emit()"
            />
            <app-ui-button
              label="Agregar todos"
              variant="outlined"
              size="compact"
              [ariaLabel]="
                'Agregar toda la existencia disponible de ' +
                product().name +
                ': ' +
                available() +
                ' unidades'
              "
              (pressed)="addAll.emit()"
            />
          } @else {
            <app-ui-button
              [label]="actionLabel()"
              [icon]="available() === 0 ? undefined : 'check'"
              tone="neutral"
              size="compact"
              [disabled]="true"
              [fullWidth]="true"
              [ariaLabel]="actionLabel() + ' para ' + product().name"
            />
          }
        </div>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrl: './product-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTileComponent {
  readonly product = input.required<PosProduct>();
  readonly available = input.required<number>();
  readonly canAdd = input.required<boolean>();
  readonly add = output<void>();
  readonly addAll = output<void>();

  protected readonly actionLabel = computed(() => {
    if (this.available() === 0) return 'Sin stock';
    return this.canAdd() ? 'Agregar' : 'Máximo agregado';
  });
}
