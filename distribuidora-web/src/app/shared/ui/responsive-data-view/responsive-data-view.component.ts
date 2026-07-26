import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { UiIconButtonComponent } from '../button/ui-icon-button.component';
import { UiStatusChipComponent } from '../status-chip/ui-status-chip.component';

export interface DataColumn<T extends object> {
  key: keyof T & string;
  label: string;
  priority?: 'primary' | 'secondary';
  format?: (value: unknown, row: T) => string;
}

@Component({
  selector: 'app-responsive-data-view',
  imports: [MatTableModule, UiIconButtonComponent, UiStatusChipComponent],
  template: `
    <div class="desktop-view">
      <table mat-table [dataSource]="rows()">
        @for (column of columns(); track column.key) {
          <ng-container [matColumnDef]="column.key">
            <th mat-header-cell *matHeaderCellDef>{{ column.label }}</th>
            <td mat-cell *matCellDef="let row">{{ value(column, row) }}</td>
          </ng-container>
        }
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef><span class="visually-hidden">Acciones</span></th>
          <td mat-cell *matCellDef="let row">
            <app-ui-icon-button icon="edit" ariaLabel="Editar registro" (pressed)="edit.emit(row)" />
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>

    <div class="mobile-view">
      @for (row of rows(); track trackById($index, row)) {
        <article>
          <div class="card-title">
            <strong>{{ primaryValue(row) }}</strong>
            @if (activeKey()) {
              <app-ui-status-chip
                [label]="row[activeKey()!] ? 'Activo' : 'Inactivo'"
                [tone]="row[activeKey()!] ? 'success' : 'neutral'"
              />
            }
          </div>
          <dl>
            @for (column of secondaryColumns(); track column.key) {
              <div>
                <dt>{{ column.label }}</dt>
                <dd>{{ value(column, row) }}</dd>
              </div>
            }
          </dl>
          <app-ui-icon-button icon="edit" ariaLabel="Editar registro" (pressed)="edit.emit(row)" />
        </article>
      }
    </div>
  `,
  styles: `
    :host { display: block; overflow: hidden; border-radius: var(--app-radius-md); }
    table { width: 100%; background: var(--app-surface); }
    th { color: var(--app-text-muted); font-weight: 700; }
    .mobile-view { display: grid; gap: var(--space-3); }
    article {
      position: relative;
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid color-mix(in srgb, var(--app-text) 10%, transparent);
      border-radius: var(--app-radius-md);
      background: var(--app-surface);
    }
    article > app-ui-icon-button { position: absolute; right: var(--space-2); bottom: var(--space-2); }
    .card-title { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding-right: 2.5rem; }
    dl { display: grid; gap: var(--space-2); margin: 0; }
    dl div { display: grid; grid-template-columns: minmax(6rem, 0.7fr) minmax(0, 1.3fr); gap: var(--space-2); }
    dt { color: var(--app-text-muted); }
    dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
    .desktop-view { display: none; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (min-width: 48rem) {
      .desktop-view { display: block; overflow-x: auto; }
      .mobile-view { display: none; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveDataViewComponent<T extends object> {
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly DataColumn<T>[]>();
  readonly activeKey = input<keyof T & string>();
  readonly edit = output<T>();

  protected get displayedColumns(): string[] {
    return [...this.columns().map((column) => column.key), 'actions'];
  }

  protected secondaryColumns(): readonly DataColumn<T>[] {
    return this.columns().filter((column) => column.priority !== 'primary');
  }

  protected primaryValue(row: T): string {
    const column = this.columns().find((candidate) => candidate.priority === 'primary') ?? this.columns()[0];
    return column ? this.value(column, row) : 'Registro';
  }

  protected value(column: DataColumn<T>, row: T): string {
    const raw = row[column.key];
    if (column.format) return column.format(raw, row);
    if (raw === null || raw === undefined || raw === '') return '—';
    if (typeof raw === 'boolean') return raw ? 'Sí' : 'No';
    return String(raw);
  }

  protected trackById(index: number, row: T): unknown {
    return 'id' in row ? row['id'] : index;
  }
}
