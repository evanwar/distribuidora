import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PermissionService } from '../../../core/permissions/permission.service';
import { UiIconComponent, UiIconName } from '../icon/ui-icon.component';

export type UiButtonVariant = 'filled' | 'outlined' | 'text';
export type UiButtonTone = 'primary' | 'neutral' | 'danger';
export type UiButtonSize = 'compact' | 'comfortable';

@Component({
  selector: 'app-ui-button',
  imports: [MatButtonModule, MatProgressSpinnerModule, NgTemplateOutlet, UiIconComponent],
  host: {
    '[class.ui-button-host--full]': 'fullWidth()',
  },
  template: `
    @if (visible()) {
      @switch (variant()) {
        @case ('outlined') {
          <button
            matButton="outlined"
            [type]="type()"
            [disabled]="blocked()"
            [class]="buttonClasses()"
            [attr.aria-label]="ariaLabel() || label()"
            [attr.aria-busy]="loading()"
            (click)="activate()"
          >
            <ng-container *ngTemplateOutlet="content" />
          </button>
        }
        @case ('text') {
          <button
            matButton
            [type]="type()"
            [disabled]="blocked()"
            [class]="buttonClasses()"
            [attr.aria-label]="ariaLabel() || label()"
            [attr.aria-busy]="loading()"
            (click)="activate()"
          >
            <ng-container *ngTemplateOutlet="content" />
          </button>
        }
        @default {
          <button
            matButton="filled"
            [type]="type()"
            [disabled]="blocked()"
            [class]="buttonClasses()"
            [attr.aria-label]="ariaLabel() || label()"
            [attr.aria-busy]="loading()"
            (click)="activate()"
          >
            <ng-container *ngTemplateOutlet="content" />
          </button>
        }
      }
    }

    <ng-template #content>
      @if (loading()) {
        <mat-spinner diameter="18" aria-hidden="true" />
      } @else if (icon() && iconPosition() === 'start') {
        <app-ui-icon [name]="icon()!" />
      }
      <span>{{ loading() ? loadingLabel() : label() }}</span>
      @if (!loading() && icon() && iconPosition() === 'end') {
        <app-ui-icon [name]="icon()!" />
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    :host.ui-button-host--full,
    :host.ui-button-host--full button {
      width: 100%;
    }

    button {
      display: inline-flex;
      gap: var(--space-2);
      max-width: 100%;
      min-height: 2.75rem;
      font-weight: 650;
    }

    .ui-button--comfortable {
      min-height: 3rem;
      padding-inline: 1.25rem;
    }

    .ui-button--danger {
      --mat-button-filled-container-color: var(--app-danger);
      --mat-button-filled-label-text-color: white;
      --mat-button-outlined-label-text-color: var(--app-danger);
      --mat-button-text-label-text-color: var(--app-danger);
    }

    .ui-button--neutral {
      --mat-button-filled-container-color: var(--app-surface-muted);
      --mat-button-filled-label-text-color: var(--app-text);
    }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  private readonly permissions = inject(PermissionService);

  readonly label = input.required<string>();
  readonly loadingLabel = input('Procesando…');
  readonly variant = input<UiButtonVariant>('filled');
  readonly tone = input<UiButtonTone>('primary');
  readonly size = input<UiButtonSize>('comfortable');
  readonly icon = input<UiIconName>();
  readonly iconPosition = input<'start' | 'end'>('start');
  readonly type = input<'button' | 'submit'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly permission = input<string>();
  readonly ariaLabel = input<string>();
  readonly fullWidth = input(false);
  readonly pressed = output<void>();

  protected readonly blocked = computed(() => this.loading() || this.disabled());
  protected readonly visible = computed(() => this.permissions.has(this.permission()));
  protected readonly buttonClasses = computed(
    () => `ui-button--${this.tone()} ui-button--${this.size()}`,
  );

  protected activate(): void {
    if (!this.blocked()) {
      this.pressed.emit();
    }
  }
}
