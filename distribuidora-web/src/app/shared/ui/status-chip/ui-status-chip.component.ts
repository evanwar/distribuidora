import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { UiIconComponent, UiIconName } from '../icon/ui-icon.component';

export type UiStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-ui-status-chip',
  imports: [MatChipsModule, UiIconComponent],
  template: `
    <mat-chip [class]="'ui-status--' + tone()">
      @if (icon()) {
        <app-ui-icon [name]="icon()!" />
      }
      {{ label() }}
    </mat-chip>
  `,
  styles: `
    mat-chip {
      --mat-chip-label-text-weight: 650;
    }

    .ui-status--success {
      --mat-chip-elevated-container-color: color-mix(in srgb, var(--app-success) 14%, white);
      --mat-chip-label-text-color: var(--app-success);
    }

    .ui-status--warning {
      --mat-chip-elevated-container-color: color-mix(in srgb, var(--app-warning) 14%, white);
      --mat-chip-label-text-color: var(--app-warning);
    }

    .ui-status--danger {
      --mat-chip-elevated-container-color: color-mix(in srgb, var(--app-danger) 12%, white);
      --mat-chip-label-text-color: var(--app-danger);
    }

    .ui-status--info {
      --mat-chip-elevated-container-color: color-mix(in srgb, var(--app-info) 12%, white);
      --mat-chip-label-text-color: var(--app-info);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStatusChipComponent {
  readonly label = input.required<string>();
  readonly tone = input<UiStatusTone>('neutral');
  readonly icon = input<UiIconName>();
}
