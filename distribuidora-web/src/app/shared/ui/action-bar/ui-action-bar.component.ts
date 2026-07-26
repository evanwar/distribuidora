import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-action-bar',
  template: `<div [class.ui-action-bar--sticky]="sticky()"><ng-content /></div>`,
  styles: `
    div {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--app-radius-md);
      background: color-mix(in srgb, var(--app-surface) 94%, transparent);
    }

    .ui-action-bar--sticky {
      position: sticky;
      z-index: 4;
      bottom: var(--space-2);
      border: 1px solid color-mix(in srgb, var(--app-text) 10%, transparent);
      box-shadow: var(--app-shadow);
      backdrop-filter: blur(14px);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiActionBarComponent {
  readonly sticky = input(false);
}
