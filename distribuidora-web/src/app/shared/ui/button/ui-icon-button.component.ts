import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermissionService } from '../../../core/permissions/permission.service';
import { UiIconComponent, UiIconName } from '../icon/ui-icon.component';

@Component({
  selector: 'app-ui-icon-button',
  imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, UiIconComponent],
  template: `
    @if (visible()) {
      <button
        matIconButton
        type="button"
        [disabled]="blocked()"
        [matTooltip]="ariaLabel()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-busy]="loading()"
        (click)="activate()"
      >
        @if (loading()) {
          <mat-spinner diameter="18" />
        } @else {
          <app-ui-icon [name]="icon()" />
        }
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
    }

    button {
      width: 3rem;
      height: 3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconButtonComponent {
  private readonly permissions = inject(PermissionService);
  readonly icon = input.required<UiIconName>();
  readonly ariaLabel = input.required<string>();
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly permission = input<string>();
  readonly pressed = output<void>();

  protected readonly blocked = computed(() => this.loading() || this.disabled());
  protected readonly visible = computed(() => this.permissions.has(this.permission()));

  protected activate(): void {
    if (!this.blocked()) this.pressed.emit();
  }
}
