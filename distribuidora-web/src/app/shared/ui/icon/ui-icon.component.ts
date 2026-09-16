import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiIconName =
  | 'add'
  | 'alias'
  | 'audit'
  | 'category'
  | 'check'
  | 'close'
  | 'customers'
  | 'download'
  | 'edit'
  | 'empty'
  | 'home'
  | 'history'
  | 'help'
  | 'inventory'
  | 'low-stock'
  | 'masters'
  | 'menu'
  | 'minus'
  | 'open'
  | 'point-of-sale'
  | 'print'
  | 'products'
  | 'purchases'
  | 'receivables'
  | 'receipt'
  | 'refresh'
  | 'reports'
  | 'search'
  | 'security'
  | 'settings'
  | 'suppliers'
  | 'unit'
  | 'warehouse'
  | 'warning';

const ICON_PATHS: Record<UiIconName, readonly string[]> = {
  add: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  check: ['m5 12.5 4.25 4.25L19 7'],
  edit: ['m4 20 4.25-1 10.9-10.9-3.25-3.25L5 15.75 4 20Z', 'm13.9 6.85 3.25 3.25'],
  open: ['M8 16 16.5 7.5', 'M10.5 7.5h6v6'],
  refresh: ['M19 8a7.5 7.5 0 0 0-13-2L4 8', 'M4 4v4h4', 'M5 16a7.5 7.5 0 0 0 13 2l2-2', 'M20 20v-4h-4'],
  search: ['M10.75 17.5a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5Z', 'm16 16 4.5 4.5'],
  history: ['M4 12a8 8 0 1 0 2.25-5.55L4 8.75', 'M4 4.5v4.25h4.25', 'M12 7.5V12l3 2'],
  help: ['M9.25 9a2.85 2.85 0 1 1 4.7 2.15c-1.4 1-1.95 1.65-1.95 3.1', 'M12 18h.01', 'M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Z'],
  print: ['M7 9V4h10v5', 'M7 17H4V9h16v8h-3', 'M7 14h10v6H7z', 'M17 11h.01'],
  download: ['M12 3v12', 'm7.5 10.5 4.5 4.5 4.5-4.5', 'M5 20h14'],
  receipt: ['M6 3.5h12v17l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  empty: ['m12 3.25 8 4.25v9L12 20.75l-8-4.25v-9z', 'm4.25 7.5 7.75 4 7.75-4', 'M12 11.5v9'],
  warning: ['M12 4 21 20H3L12 4Z', 'M12 9v5', 'M12 17h.01'],
  category: ['M4 5h6v6H4z', 'M14 5h6v6h-6z', 'M4 15h6v4H4z', 'M14 15h6v4h-6z'],
  alias: ['M7.5 7.5h-1a4 4 0 0 0 0 8h3', 'M14.5 7.5h3a4 4 0 0 1 0 8h-1', 'M8.5 12h7'],
  unit: ['M4 7h16', 'M7 4v6', 'M17 4v6', 'M4 17h16', 'M9 14v6', 'M15 14v6'],
  warehouse: ['M3.5 9 12 4l8.5 5v11h-17V9Z', 'M7 12h10v8', 'M10 15h4'],
  'low-stock': ['M4 5h16v14H4z', 'M8 9h8', 'M12 12v3', 'M12 17h.01'],
  home: ['M3.75 10.5 12 3.75l8.25 6.75', 'M5.25 9.75v10.5h13.5V9.75', 'M9.25 20.25v-6.5h5.5v6.5'],
  'point-of-sale': [
    'M4 4.25h16v15.5H4z',
    'M4 8.25h16',
    'M7.25 12h4.5v4.25h-4.5z',
    'M15 12h1.75',
    'M15 15.25h1.75',
  ],
  inventory: [
    'M4.25 5.25h6.5v6.5h-6.5z',
    'M13.25 5.25h6.5v6.5h-6.5z',
    'M4.25 14.25h6.5v5.5h-6.5z',
    'M13.25 14.25h6.5v5.5h-6.5z',
  ],
  purchases: ['M5.25 8.25h13.5l-1 11H6.25z', 'M8.25 8.25a3.75 3.75 0 0 1 7.5 0', 'M9.25 12.25h5.5'],
  receivables: [
    'M4 6.25A2.25 2.25 0 0 1 6.25 4h12.5v16H6.25A2.25 2.25 0 0 1 4 17.75z',
    'M4 7h14.75',
    'M14.25 11h5.75v5h-5.75a2.5 2.5 0 0 1 0-5z',
    'M16.75 13.5h.01',
  ],
  customers: [
    'M8.25 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z',
    'M2.75 19.5a5.5 5.5 0 0 1 11 0',
    'M15.5 10.5a2.75 2.75 0 1 0 0-5.5',
    'M16 14a4.75 4.75 0 0 1 5.25 4.75',
  ],
  suppliers: [
    'M3.25 6.25h11.5v11.5H3.25z',
    'M14.75 10.25h3l3 3.25v4.25h-6z',
    'M6.75 20.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z',
    'M17.75 20.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z',
  ],
  products: [
    'm12 3.25 8 4.25v9L12 20.75l-8-4.25v-9z',
    'm4.25 7.5 7.75 4 7.75-4',
    'M12 11.5v9',
    'm8 5.25 8 4.25',
  ],
  masters: [
    'M4 6.25h5',
    'M13 6.25h7',
    'M11 4.25v4',
    'M4 12h10',
    'M18 12h2',
    'M16 10v4',
    'M4 17.75h2',
    'M10 17.75h10',
    'M8 15.75v4',
  ],
  security: [
    'M12 3.25 19 6v5.25c0 4.5-2.75 7.75-7 9.5-4.25-1.75-7-5-7-9.5V6z',
    'M9.25 11.5 11 13.25l3.75-4',
  ],
  reports: [
    'M4.25 19.75V12.5h3.5v7.25z',
    'M10.25 19.75V8.5h3.5v11.25z',
    'M16.25 19.75v-15.5h3.5v15.5z',
  ],
  audit: [
    'M8 4.75h8',
    'M9 3.25h6v3H9z',
    'M6 5.25H4.75v15.5h14.5V5.25H18',
    'm8.25 13 2.25 2.25 4.5-5',
  ],
  settings: [
    'M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z',
    'M19.25 13.5a7.73 7.73 0 0 0 .05-3l1.7-1.3-2-3.45-2 .8a8 8 0 0 0-2.6-1.5L14 3h-4l-.4 2.05A8 8 0 0 0 7 6.55l-2-.8-2 3.45 1.7 1.3a7.73 7.73 0 0 0 .05 3L3 14.8l2 3.45 2-.8a8 8 0 0 0 2.6 1.5L10 21h4l.4-2.05a8 8 0 0 0 2.6-1.5l2 .8 2-3.45z',
  ],
  menu: ['M4 6.5h16', 'M4 12h16', 'M4 17.5h16'],
};

@Component({
  selector: 'app-ui-icon',
  template: `
    <svg viewBox="0 0 24 24" focusable="false">
      @for (path of paths(); track path) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      width: 1.25rem;
      height: 1.25rem;
      flex: 0 0 auto;
      place-items: center;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.65;
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  readonly name = input.required<UiIconName>();
  protected readonly paths = () => ICON_PATHS[this.name()];
}
