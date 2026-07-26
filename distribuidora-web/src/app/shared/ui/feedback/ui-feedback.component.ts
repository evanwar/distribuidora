import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiButtonComponent } from '../button/ui-button.component';
import { UiIconComponent, UiIconName } from '../icon/ui-icon.component';

export type UiFeedbackKind = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-ui-feedback',
  imports: [MatProgressSpinnerModule, UiButtonComponent, UiIconComponent],
  template: `
    <section [attr.aria-live]="kind() === 'loading' ? 'polite' : 'assertive'">
      @if (kind() === 'loading') {
        <mat-spinner diameter="34" />
      } @else {
        <span class="ui-feedback__icon"><app-ui-icon [name]="icon()" /></span>
      }
      <div>
        <h2>{{ title() }}</h2>
        <p>{{ message() }}</p>
      </div>
      @if (actionLabel()) {
        <app-ui-button [label]="actionLabel()!" variant="outlined" (pressed)="action.emit()" />
      }
    </section>
  `,
  styles: `
    section {
      display: grid;
      justify-items: center;
      gap: var(--space-3);
      min-height: 14rem;
      padding: var(--space-6);
      text-align: center;
    }

    .ui-feedback__icon {
      display: grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      border-radius: var(--app-radius-sm);
      background: var(--app-surface-muted);
      color: var(--app-primary);
    }

    .ui-feedback__icon app-ui-icon {
      width: 1.6rem;
      height: 1.6rem;
    }

    h2,
    p {
      margin: 0;
    }

    p {
      margin-top: var(--space-2);
      color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFeedbackComponent {
  readonly kind = input.required<UiFeedbackKind>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly icon = input<UiIconName>('empty');
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
