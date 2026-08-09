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
import {
  DataColumn,
  ResponsiveDataViewComponent,
} from '../../ui/responsive-data-view/responsive-data-view.component';
import { EntityRecord, EntityResourceDefinition } from './entity-manager.models';
import { EntityManagerStore } from './entity-manager.store';
import { LocalizedPaginatorIntl } from '../../../core/i18n/localized-paginator-intl';
import { LanguageService } from '../../../core/i18n/language.service';

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
  providers: [EntityManagerStore, { provide: MatPaginatorIntl, useClass: LocalizedPaginatorIntl }],
  template: `
    <div class="page">
      <app-ui-page-header
        [eyebrow]="text(definition.module)"
        [title]="text(definition.title)"
        [subtitle]="text(definition.description)"
      >
        <app-ui-button [label]="newLabel()" icon="add" (pressed)="open()" />
      </app-ui-page-header>

      @if (store.error()) {
        <app-ui-alert
          [title]="text('La operación no se completó')"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          [operationId]="store.error()!.operationId"
          [actionLabel]="text('Recargar')"
          (action)="store.load()"
        />
      }

      @if (editorOpen()) {
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>
              {{ selected() ? text('Editar') : text('Nuevo') }} {{ text(definition.singular) }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-grid">
                @for (field of definition.fields; track field.key) {
                  @if (field.type === 'boolean') {
                    <mat-checkbox [formControlName]="field.key">{{ text(field.label) }}</mat-checkbox>
                  } @else if (field.type === 'select') {
                    <mat-form-field appearance="outline">
                      <mat-label>{{ text(field.label) }}</mat-label>
                      <mat-select [formControlName]="field.key">
                        @for (option of store.optionsFor(field); track option.value) {
                          <mat-option [value]="option.value">{{ text(option.label) }}</mat-option>
                        }
                      </mat-select>
                      @if (form.controls[field.key]?.hasError('required')) {
                        <mat-error>{{ requiredLabel(field.label) }}</mat-error>
                      }
                    </mat-form-field>
                  } @else {
                    <mat-form-field appearance="outline">
                      <mat-label>{{ text(field.label) }}</mat-label>
                      <input matInput [type]="field.type" [formControlName]="field.key" />
                      @if (form.controls[field.key]?.hasError('required')) {
                        <mat-error>{{ requiredLabel(field.label) }}</mat-error>
                      }
                    </mat-form-field>
                  }
                }
              </div>
              <app-ui-action-bar [sticky]="true">
                <app-ui-button [label]="text('Cancelar')" variant="text" tone="neutral" (pressed)="close()" />
                <app-ui-button
                  [label]="saveLabel()"
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
            [title]="loadingLabel()"
            [message]="text('Consultando el catálogo.')"
          />
        </section>
      } @else if (store.rows().length === 0) {
        <section class="surface">
          <app-ui-feedback
            kind="empty"
            [title]="emptyLabel()"
            [message]="emptyMessage()"
            [actionLabel]="newLabel()"
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
            [attr.aria-label]="language.language() === 'en' ? 'Catalog pagination' : 'Paginación del catálogo'"
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
  protected readonly language = inject(LanguageService);
  protected readonly store = inject(EntityManagerStore);
  protected readonly definition = this.route.snapshot.data['resource'] as EntityResourceDefinition;
  protected readonly editorOpen = signal(false);
  protected readonly selected = signal<EntityRecord | null>(null);
  protected readonly form = new FormRecord<EntityControl>({});
  protected readonly columns: readonly DataColumn<EntityRecord>[] = this.definition.fields
    .filter((field) => field.table !== false)
    .map((field, index) => ({
      key: field.key,
      label: this.text(field.label),
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

  protected text(value: string): string {
    return this.language.text(value);
  }

  protected newLabel(): string {
    return this.language.language() === 'en'
      ? `New ${this.text(this.definition.singular)}`
      : `Nuevo ${this.definition.singular}`;
  }

  protected saveLabel(): string {
    if (this.selected()) return this.text('Guardar cambios');
    return this.language.language() === 'en'
      ? `Create ${this.text(this.definition.singular)}`
      : `Crear ${this.definition.singular}`;
  }

  protected loadingLabel(): string {
    return this.language.language() === 'en'
      ? `Loading ${this.text(this.definition.title).toLowerCase()}`
      : `Cargando ${this.definition.title.toLowerCase()}`;
  }

  protected emptyLabel(): string {
    return this.language.language() === 'en'
      ? `No ${this.text(this.definition.title).toLowerCase()} yet`
      : `Todavía no hay ${this.definition.title.toLowerCase()}`;
  }

  protected emptyMessage(): string {
    return this.language.language() === 'en'
      ? `Register the first ${this.text(this.definition.singular)} to get started.`
      : `Registra el primer ${this.definition.singular} para comenzar.`;
  }

  protected requiredLabel(label: string): string {
    return this.language.language() === 'en'
      ? `${this.text(label)} is required.`
      : `${label} es obligatorio.`;
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
