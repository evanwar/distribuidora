import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-ui-money',
  imports: [CurrencyPipe],
  template: `<span class="ui-money">{{ amount() | currency: currency() : 'symbol-narrow' : '1.2-2' }}</span>`,
  styles: `.ui-money { font-variant-numeric: tabular-nums; font-weight: 650; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMoneyComponent {
  readonly amount = input.required<number>();
  readonly currency = input('MXN');
}
