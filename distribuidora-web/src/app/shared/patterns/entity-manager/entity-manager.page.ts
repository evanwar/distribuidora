import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { UiActionBarComponent } from '../../ui/action-bar/ui-action-bar.component';
import { UiAlertComponent } from '../../ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../ui/feedback/ui-feedback.component';
import { UiPageHeaderComponent } from '../../ui/page-header/ui-page-header.component';
import { SpanishPaginatorIntl } from '../../../core/i18n/spanish-paginator-intl';
import {
  DataColumn,
  ResponsiveDataViewComponent,
} from '../../ui/responsive-data-view/responsive-data-view.component';
import { EntityRecord, EntityResourceDefinition } from './entity-manager.models';
import { EntityManagerStore } from './entity-manager.store';

type EntityControl = FormControl<string | number | boolean>;

@Component({
  selector: 'app-entity-manager-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    ResponsiveDataViewComponent,
    UiActionBarComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiFeedbackComponent,
    UiPageHeaderComponent,
  ],
  providers: [EntityManagerStore, { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }],
  template: `
    <div class="page">
      <app-ui-page-header
        [eyebrow]="definition.module"
        [title]="definition.title"
        [subtitle]="definition.description"
      >
        <app-ui-button [label]="'Nuevo ' + definition.singular" icon="add" (pressed)="open()" />
      </app-ui-page-header>

      @if (store.error()) {
        <app-ui-alert
          title="La operación no se completó"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          [operationId]="store.error()!.operationId"
          actionLabel="Recargar"
          (action)="store.load()"
        />
      }

      @if (editorOpen()) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>
              {{ selected() ? 'Editar' : 'Nuevo' }} {{ definition.singular }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-grid">
                @for (field of definition.fields; track field.key) {
                  @if (field.type === 'boolean') {
                    <mat-checkbox [formControlName]="field.key">{{ field.label }}</mat-checkbox>
                  } @else if (field.type === 'select') {
                    <mat-form-field appearance="outline">
                      <mat-label>{{ field.label }}</mat-label>
                      <mat-select [formControlName]="field.key">
                        @for (option of store.optionsFor(field); track option.value) {
                          <mat-option [value]="option.value">{{ option.label }}</mat-option>
                        }
                      </mat-select>
                      @if (form.controls[field.key]?.hasError('required')) {
                        <mat-error>{{ field.label }} es obligatorio.</mat-error>
                      }
                    </mat-form-field>
                  } @else {
                    <mat-form-field appearance="outline">
                      <mat-label>{{ field.label }}</mat-label>
                      <input matInput [type]="field.type" [formControlName]="field.key" />
                      @if (form.controls[field.key]?.hasError('required')) {
                        <mat-error>{{ field.label }} es obligatorio.</mat-error>
                      }
                    </mat-form-field>
                  }
                }
              </div>
              <app-ui-action-bar [sticky]="true">
                <app-ui-button label="Cancelar" variant="text" tone="neutral" (pressed)="close()" />
                <app-ui-button
                  [label]="selected() ? 'Guardar cambios' : 'Crear ' + definition.singular"
                  type="submit"
                  [loading]="store.saving()"
                  [disabled]="form.invalid"
                />
              </app-ui-action-bar>
            </form>
          </mat-card-content>
        </mat-card>
      }

      @if (store.loading()) {
        <section class="surface">
          <app-ui-feedback
            kind="loading"
            [title]="'Cargando ' + definition.title.toLowerCase()"
            message="Consultando el catálogo."
          />
        </section>
      } @else if (store.rows().length === 0) {
        <section class="surface">
          <app-ui-feedback
            kind="empty"
            [title]="'Todavía no hay ' + definition.title.toLowerCase()"
            [message]="'Registra el primer ' + definition.singular + ' para comenzar.'"
            [actionLabel]="'Nuevo ' + definition.singular"
            (action)="open()"
          />
        </section>
      } @else {
        <app-responsive-data-view
          [rows]="store.rows()"
          [columns]="columns"
          activeKey="active"
          (edit)="open($event)"
        />
        @if (definition.paged) {
          <mat-paginator
            [length]="store.total()"
            [pageIndex]="store.page() - 1"
            [pageSize]="store.pageSize()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            aria-label="Paginación de productos"
            (page)="changePage($event)"
          />
        }
      }
    </div>
  `,
  styles: `
    mat-card {
      border-radius: var(--app-radius-md);
    }
    mat-card-content,
    form {
      display: grid;
      gap: var(--space-4);
    }
    mat-card-content {
      padding-top: var(--space-5);
    }
    mat-checkbox {
      align-self: center;
      padding: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityManagerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(EntityManagerStore);
  protected readonly definition = this.route.snapshot.data['resource'] as EntityResourceDefinition;
  protected readonly editorOpen = signal(false);
  protected readonly selected = signal<EntityRecord | null>(null);
  protected readonly form = new FormRecord<EntityControl>({});
  protected readonly columns: readonly DataColumn<EntityRecord>[] = this.definition.fields
    .filter((field) => field.table !== false)
    .map((field, index) => ({
      key: field.key,
      label: field.label,
      priority: index === 0 ? 'primary' : 'secondary',
    }));

  ngOnInit(): void {
    for (const field of this.definition.fields) {
      this.form.addControl(
        field.key,
        new FormControl(field.defaultValue ?? defaultFor(field.type), {
          nonNullable: true,
          validators: field.required ? [Validators.required] : [],
        }),
      );
    }
    this.store.configure(this.definition);
    this.store.load();
  }

  protected open(row?: EntityRecord): void {
    this.selected.set(row ?? null);
    const values: Record<string, string | number | boolean> = {};
    for (const field of this.definition.fields) {
      const value = row?.[field.key];
      values[field.key] =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? value
          : (field.defaultValue ?? defaultFor(field.type));
    }
    this.form.reset(values);
    this.editorOpen.set(true);
    if (row?.id && this.definition.detailEndpoint) {
      this.store.loadOne(row.id, (detail) => this.fillForm(detail));
    }
  }

  protected close(): void {
    this.editorOpen.set(false);
    this.selected.set(null);
  }

  protected submit(): void {
    if (this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.save(this.selected()?.id, this.form.getRawValue(), () => this.close());
  }

  protected changePage(event: PageEvent): void {
    this.store.load(event.pageIndex + 1, event.pageSize);
  }

  private fillForm(row: EntityRecord): void {
    const values: Record<string, string | number | boolean> = {};
    for (const field of this.definition.fields) {
      const value = row[field.key];
      values[field.key] =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? value
          : (field.defaultValue ?? defaultFor(field.type));
    }
    this.form.reset(values);
  }
}

function defaultFor(
  type: 'text' | 'email' | 'number' | 'boolean' | 'select',
): string | number | boolean {
  if (type === 'number') return 0;
  if (type === 'boolean') return true;
  return '';
}
