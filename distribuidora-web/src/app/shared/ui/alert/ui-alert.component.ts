import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';

export type UiAlertTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-ui-alert',
  imports: [UiButtonComponent],
  template: `
    <section [class]="'ui-alert ui-alert--' + tone()" [attr.role]="tone() === 'danger' ? 'alert' : 'status'">
      <div>
        <strong>{{ title() }}</strong>
        <p>{{ message() }}</p>
        @if (correlationId()) {
          <small>Referencia: {{ correlationId() }}</small>
        }
      </div>
      @if (actionLabel()) {
        <app-ui-button
          [label]="actionLabel()!"
          variant="text"
          [tone]="tone() === 'danger' ? 'danger' : 'primary'"
          (pressed)="action.emit()"
        />
      }
    </section>
  `,
  styles: `
    .ui-alert {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-4);
      border-inline-start: 0.3rem solid var(--app-info);
      border-radius: var(--app-radius-sm);
      background: color-mix(in srgb, var(--app-info) 8%, white);
    }

    .ui-alert--success {
      border-color: var(--app-success);
      background: color-mix(in srgb, var(--app-success) 8%, white);
    }

    .ui-alert--warning {
      border-color: var(--app-warning);
      background: color-mix(in srgb, var(--app-warning) 8%, white);
    }

    .ui-alert--danger {
      border-color: var(--app-danger);
      background: color-mix(in srgb, var(--app-danger) 7%, white);
    }

    p {
      margin: var(--space-1) 0 0;
    }

    small {
      display: block;
      margin-top: var(--space-2);
      color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAlertComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly tone = input<UiAlertTone>('info');
  readonly correlationId = input<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
