import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-page-header',
  template: `
    <header [class.ui-page-header--compact]="compact()">
      <div class="ui-page-header__copy">
        @if (eyebrow()) {
          <span class="ui-page-header__eyebrow">{{ eyebrow() }}</span>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="ui-page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
    }

    h1 {
      margin: 0;
      font-size: clamp(1.65rem, 5vw, 2.35rem);
      line-height: 1.1;
      letter-spacing: -0.035em;
    }

    p {
      max-width: 65ch;
      margin: var(--space-2) 0 0;
      color: var(--app-text-muted);
    }

    .ui-page-header__eyebrow {
      display: block;
      margin-bottom: var(--space-2);
      color: var(--app-info);
      font-size: 0.75rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .ui-page-header__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    @media (min-width: 48rem) {
      header.ui-page-header--compact {
        align-items: center;
        gap: var(--space-3);
      }

      .ui-page-header--compact .ui-page-header__copy {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        min-width: 0;
        align-items: baseline;
        column-gap: var(--space-3);
        row-gap: 0.2rem;
      }

      .ui-page-header--compact .ui-page-header__eyebrow {
        grid-column: 1 / -1;
        margin: 0;
      }

      .ui-page-header--compact h1 {
        flex: 0 0 auto;
        font-size: 1.75rem;
      }

      .ui-page-header--compact p {
        align-self: center;
        overflow: hidden;
        margin: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly eyebrow = input<string>();
  readonly compact = input(false);
}
