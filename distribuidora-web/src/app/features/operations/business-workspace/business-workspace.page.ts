import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { ENDPOINT_CATALOG, EndpointDefinition } from '../../../core/api/endpoint-catalog.generated';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiIconButtonComponent } from '../../../shared/ui/button/ui-icon-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiIconComponent, UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import { UiStatusChipComponent } from '../../../shared/ui/status-chip/ui-status-chip.component';
import { OperationWorkbenchStore } from '../data-access/operation-workbench.store';
import { BUSINESS_FIELDS, BUSINESS_MODULES, BUSINESS_TITLES } from './business-workspace.config';
import { BusinessField, BusinessLineField, BusinessResultRow } from './business-workspace.models';

type FieldValue =
  string | number | boolean | readonly string[] | readonly Record<string, string | number>[];

@Component({
  selector: 'app-business-workspace-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    UiAlertComponent,
    UiButtonComponent,
    UiFeedbackComponent,
    UiIconComponent,
    UiIconButtonComponent,
    UiPageHeaderComponent,
    UiStatusChipComponent,
  ],
  providers: [OperationWorkbenchStore],
  template: `
    <div class="page business-page">
      <app-ui-page-header
        [eyebrow]="definition.eyebrow"
        [title]="definition.title"
        [subtitle]="definition.description"
      />

      @if (workflowMessage()) {
        <app-ui-alert title="Siguiente paso" [message]="workflowMessage()!" tone="info" />
      }

      <section class="workspace">
        <nav class="surface task-nav" aria-label="Tareas disponibles">
          @for (group of groups(); track group) {
            <section class="task-group">
              <h2>{{ group }}</h2>
              <div class="task-list">
                @for (operation of operationsFor(group); track operation.id) {
                  <button
                    type="button"
                    class="task"
                    [class.task--active]="selected()?.id === operation.id"
                    (click)="select(operation)"
                  >
                    <span class="task__icon"
                      ><app-ui-icon [name]="operationIcon(operation)"
                    /></span>
                    <span>
                      <strong>{{ titleFor(operation) }}</strong>
                      <small>{{ shortDescription(operation) }}</small>
                    </span>
                    <app-ui-icon name="open" />
                  </button>
                }
              </div>
            </section>
          }
        </nav>

        <section class="surface task-panel">
          @if (!selected()) {
            <app-ui-feedback
              kind="empty"
              title="Selecciona una tarea"
              message="Elige una opción para consultar información o realizar una operación."
            />
          } @else {
            <header class="task-panel__header">
              <div>
                <span>{{ groupFor(selected()!) }}</span>
                <h2>{{ titleFor(selected()!) }}</h2>
                <p>{{ fullDescription(selected()!) }}</p>
              </div>
              <app-ui-status-chip
                [label]="
                  selected()!.method === 'GET'
                    ? 'Consulta'
                    : selected()!.method === 'POST'
                      ? 'Registro'
                      : 'Actualización'
                "
                [tone]="selected()!.method === 'GET' ? 'info' : 'warning'"
              />
            </header>

            @if (fields().length > 0) {
              <form class="guided-form" (submit)="execute(); $event.preventDefault()">
                <div class="form-grid">
                  @for (field of scalarFields(); track field.key) {
                    @if (field.type === 'boolean') {
                      <mat-checkbox
                        [checked]="booleanValue(field)"
                        (change)="setValue(field.key, $event.checked)"
                      >
                        {{ field.label }}
                      </mat-checkbox>
                    } @else {
                      <mat-form-field
                        appearance="outline"
                        [class.form-grid__wide]="
                          field.type === 'textarea' ||
                          field.type === 'list' ||
                          field.type === 'multi-select'
                        "
                      >
                        <mat-label>{{ field.label }}</mat-label>
                        @if (field.type === 'select' || field.type === 'multi-select') {
                          <mat-select
                            [required]="field.required"
                            [multiple]="field.type === 'multi-select'"
                            [disabled]="store.lookupLoading()"
                            [value]="selectValue(field)"
                            [typeaheadDebounceInterval]="200"
                            (selectionChange)="setValue(field.key, $event.value)"
                          >
                            @if (!field.required && field.type === 'select') {
                              <mat-option value="">Todos</mat-option>
                            }
                            @for (option of store.optionsFor(field); track option.value) {
                              <mat-option [value]="option.value">{{ option.label }}</mat-option>
                            }
                          </mat-select>
                        } @else if (field.type === 'textarea') {
                          <textarea
                            matInput
                            rows="3"
                            [required]="field.required"
                            [value]="stringValue(field)"
                            (input)="setValue(field.key, inputValue($event))"
                          ></textarea>
                        } @else {
                          <input
                            matInput
                            [type]="inputType(field)"
                            [required]="field.required"
                            [value]="stringValue(field)"
                            (input)="setValue(field.key, inputValue($event))"
                          />
                        }
                        @if (field.hint) {
                          <mat-hint>{{ field.hint }}</mat-hint>
                        } @else if (field.type === 'select') {
                          <mat-hint
                            >Escribe las primeras letras para localizar una opción.</mat-hint
                          >
                        }
                      </mat-form-field>
                    }
                  }
                </div>

                @for (field of lineFields(); track field.key) {
                  <section class="line-editor">
                    <div class="line-editor__header">
                      <div>
                        <h3>{{ field.label }}</h3>
                        <p>
                          {{
                            selected()?.id === 'INV-04'
                              ? 'Captura la existencia real de cada producto.'
                              : 'Agrega una fila por cada elemento.'
                          }}
                        </p>
                      </div>
                      <app-ui-button
                        label="Agregar"
                        icon="add"
                        variant="outlined"
                        (pressed)="addLine(field)"
                      />
                    </div>
                    @for (line of linesFor(field); track $index; let lineIndex = $index) {
                      <div class="line-editor__row">
                        <div class="line-editor__row-heading">
                          <strong>
                            {{
                              selected()?.id === 'INV-04'
                                ? 'Producto ' + (lineIndex + 1)
                                : 'Elemento ' + (lineIndex + 1)
                            }}
                          </strong>
                          <div class="line-editor__row-tools">
                            @if (
                              selected()?.id === 'INV-04' && inventoryProductField(field);
                              as productField
                            ) {
                              <div
                                class="stock-summary"
                                [class.stock-summary--ready]="
                                  adjustmentStockReady(line, productField)
                                "
                              >
                                <app-ui-icon name="warehouse" />
                                <span>Existencia:</span>
                                <strong>{{ adjustmentStock(line, productField) }}</strong>
                              </div>
                            }
                            <app-ui-icon-button
                              class="line-editor__remove"
                              icon="close"
                              [ariaLabel]="'Quitar fila ' + (lineIndex + 1)"
                              (pressed)="removeLine(field, lineIndex)"
                            />
                          </div>
                        </div>
                        @for (itemField of field.itemFields ?? []; track itemField.key) {
                          <div class="line-editor__field">
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                              <mat-label>{{ itemField.label }}</mat-label>
                              @if (itemField.type === 'select') {
                                <mat-select
                                  [required]="itemField.required"
                                  [disabled]="store.lookupLoading()"
                                  [value]="line[itemField.key]"
                                  [typeaheadDebounceInterval]="200"
                                  (selectionChange)="
                                    setLineValue(field, lineIndex, itemField, $event.value)
                                  "
                                >
                                  @for (option of store.optionsFor(itemField); track option.value) {
                                    <mat-option [value]="option.value">{{
                                      option.label
                                    }}</mat-option>
                                  }
                                </mat-select>
                              } @else {
                                <input
                                  matInput
                                  [type]="itemField.type"
                                  [required]="itemField.required"
                                  [min]="itemField.type === 'number' ? 0 : null"
                                  [step]="
                                    itemField.key === 'physicalQuantity'
                                      ? 1
                                      : itemField.key === 'unitCost'
                                        ? 0.01
                                        : 'any'
                                  "
                                  [value]="line[itemField.key]"
                                  (input)="
                                    setLineValue(field, lineIndex, itemField, inputValue($event))
                                  "
                                />
                              }
                            </mat-form-field>
                          </div>
                        }
                      </div>
                    }
                  </section>
                }

                <div class="task-panel__actions">
                  <app-ui-button
                    [label]="actionLabel(selected()!)"
                    [loading]="store.loading()"
                    [disabled]="!formComplete()"
                    type="submit"
                  />
                </div>
              </form>
            } @else {
              <div class="task-panel__actions">
                <app-ui-button
                  label="Actualizar consulta"
                  icon="refresh"
                  variant="outlined"
                  [loading]="store.loading()"
                  (pressed)="execute()"
                />
              </div>
            }

            @if (store.error()) {
              <app-ui-alert
                title="No pudimos completar la tarea"
                [message]="store.error()!.message"
                tone="danger"
                [correlationId]="store.error()!.correlationId"
                [operationId]="store.error()!.operationId"
              />
            }

            @if (store.loading()) {
              <app-ui-feedback
                kind="loading"
                title="Consultando información"
                message="La operación está en proceso."
              />
            } @else if (store.result() !== null) {
              <section class="results" aria-live="polite">
                <div class="results__header">
                  <div>
                    <h3>Resultado</h3>
                    <p>
                      {{ resultRows().length }}
                      {{ resultRows().length === 1 ? 'registro' : 'registros' }}
                    </p>
                  </div>
                  <span class="success-mark"
                    ><app-ui-icon name="check" /> Operación completada</span
                  >
                </div>
                @if (resultRows().length === 0) {
                  <div class="completed-message">
                    <span><app-ui-icon name="check" /></span>
                    <strong>La operación se completó correctamente.</strong>
                  </div>
                } @else {
                  <div class="result-grid">
                    @for (row of resultRows(); track row.id) {
                      <article class="result-card">
                        @for (value of row.values; track value.label) {
                          <div [class.result-card__primary]="$index === 0">
                            <span>{{ value.label }}</span>
                            <strong>{{ value.value }}</strong>
                          </div>
                        }
                      </article>
                    }
                  </div>
                }
              </section>
            }
          }
        </section>
      </section>
    </div>
  `,
  styleUrl: './business-workspace.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessWorkspacePage {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(OperationWorkbenchStore);
  protected readonly definition =
    BUSINESS_MODULES[String(this.route.snapshot.data['moduleKey'])] ?? BUSINESS_MODULES['F03'];
  protected readonly operations = computed(() =>
    ENDPOINT_CATALOG.filter(
      (operation) =>
        operation.module === this.definition.key &&
        !this.definition.hiddenOperationIds?.includes(operation.id),
    ),
  );
  protected readonly groups = computed(() => [
    ...new Set(this.operations().map((operation) => this.groupFor(operation))),
  ]);
  protected readonly selected = signal<EndpointDefinition | null>(null);
  protected readonly workflowMessage = signal<string | null>(null);
  private readonly lastExecutedOperation = signal<EndpointDefinition | null>(null);
  protected readonly values = signal<Readonly<Record<string, FieldValue>>>({});
  protected readonly fields = computed(
    () => (this.selected() ? BUSINESS_FIELDS[this.selected()!.id] : []) ?? [],
  );
  protected readonly scalarFields = computed(() =>
    this.fields().filter((field) => field.type !== 'lines'),
  );
  protected readonly lineFields = computed(() =>
    this.fields().filter((field) => field.type === 'lines'),
  );
  protected readonly resultRows = computed(() => toResultRows(this.store.result()));

  constructor() {
    effect(() => {
      if (this.store.lookupLoading()) return;
      const changes: Record<string, FieldValue> = {};
      for (const field of this.scalarFields()) {
        if (
          field.type === 'select' &&
          field.required &&
          this.values()[field.key] === '' &&
          this.store.optionsFor(field).length === 1
        ) {
          changes[field.key] = this.store.optionsFor(field)[0].value;
        }
      }
      if (Object.keys(changes).length > 0) {
        this.values.update((current) => ({ ...current, ...changes }));
      }
    });
  }

  protected operationsFor(group: string): readonly EndpointDefinition[] {
    return this.operations().filter((operation) => this.groupFor(operation) === group);
  }

  protected groupFor(operation: EndpointDefinition): string {
    const matchingKey = Object.keys(this.definition.groups)
      .sort((left, right) => right.length - left.length)
      .find((key) => operation.id.startsWith(key));
    return matchingKey ? this.definition.groups[matchingKey] : 'Otras tareas';
  }

  protected titleFor(operation: EndpointDefinition): string {
    return BUSINESS_TITLES[operation.id] ?? sentenceCase(operation.description);
  }

  protected shortDescription(operation: EndpointDefinition): string {
    return this.fullDescription(operation);
  }

  protected fullDescription(operation: EndpointDefinition): string {
    return sentenceCase(operation.description)
      .replace(/\s+según DTO/gi, '')
      .replace(/\s+y deep link/gi, '')
      .replace(/cuando lo exija el DTO/gi, 'cuando sea necesario')
      .replace(/\bDTO\b/gi, 'información requerida')
      .replace(/before\/after/gi, 'estado anterior y nuevo')
      .replace(/\bbackend\b/gi, 'sistema');
  }

  protected operationIcon(operation: EndpointDefinition): UiIconName {
    if (operation.method === 'GET') return 'search';
    if (operation.method === 'POST') return 'add';
    return 'edit';
  }

  protected select(operation: EndpointDefinition): void {
    this.store.prepareOperation(operation);
    this.workflowMessage.set(null);
    const previousOperation = this.lastExecutedOperation();
    const recentId =
      previousOperation && operationFamily(previousOperation) === operationFamily(operation)
        ? resultId(this.store.result())
        : '';
    this.store.clearResult();
    this.selected.set(operation);
    const initial: Record<string, FieldValue> = {};
    for (const field of BUSINESS_FIELDS[operation.id] ?? []) {
      initial[field.key] =
        field.type === 'lines'
          ? [newLine(field.itemFields ?? [])]
          : field.source === 'path' && field.key === 'id' && recentId
            ? recentId
            : (field.defaultValue ?? (field.type === 'boolean' ? false : ''));
    }
    this.values.set(initial);
    this.store.loadOptions(BUSINESS_FIELDS[operation.id] ?? []);
    if (this.definition.key === 'F03') this.store.loadBalances();
    if ((BUSINESS_FIELDS[operation.id]?.length ?? 0) === 0 && operation.method === 'GET') {
      this.execute();
    }
  }

  protected setValue(key: string, value: FieldValue): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  protected stringValue(field: BusinessField): string | number {
    const value = this.values()[field.key];
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  protected booleanValue(field: BusinessField): boolean {
    return this.values()[field.key] === true;
  }

  protected selectValue(field: BusinessField): string | number | readonly string[] {
    const value = this.values()[field.key];
    if (field.type === 'multi-select') {
      return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? value
        : typeof value === 'string'
          ? value.split(',').filter(Boolean)
          : [];
    }
    return typeof value === 'string' || typeof value === 'number' ? value : '';
  }

  protected inputType(field: BusinessField): string {
    if (field.type === 'date') return 'datetime-local';
    if (field.type === 'email' || field.type === 'password' || field.type === 'number')
      return field.type;
    return 'text';
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected linesFor(field: BusinessField): readonly Record<string, string | number>[] {
    const value = this.values()[field.key];
    return Array.isArray(value) ? value : [];
  }

  protected adjustmentStock(
    line: Readonly<Record<string, string | number>>,
    productField: BusinessLineField,
  ): string {
    const stock = this.store.availableStock(
      String(line[productField.key] ?? ''),
      String(this.values()['warehouseId'] ?? ''),
    );
    return stock === null
      ? 'selecciona almacén y producto'
      : new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 }).format(stock);
  }

  protected adjustmentStockReady(
    line: Readonly<Record<string, string | number>>,
    productField: BusinessLineField,
  ): boolean {
    return (
      this.store.availableStock(
        String(line[productField.key] ?? ''),
        String(this.values()['warehouseId'] ?? ''),
      ) !== null
    );
  }

  protected inventoryProductField(field: BusinessField): BusinessLineField | undefined {
    return field.itemFields?.find((itemField) => itemField.key === 'productId');
  }

  protected addLine(field: BusinessField): void {
    this.setValue(field.key, [...this.linesFor(field), newLine(field.itemFields ?? [])]);
  }

  protected removeLine(field: BusinessField, index: number): void {
    this.setValue(
      field.key,
      this.linesFor(field).filter((_line, lineIndex) => lineIndex !== index),
    );
  }

  protected setLineValue(
    field: BusinessField,
    index: number,
    itemField: BusinessLineField,
    value: string | number,
  ): void {
    this.setValue(
      field.key,
      this.linesFor(field).map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, [itemField.key]: itemField.type === 'number' ? Number(value) : value }
          : line,
      ),
    );
  }

  protected formComplete(): boolean {
    return this.fields()
      .filter((field) => field.required)
      .every((field) => {
        const value = this.values()[field.key];
        if (field.type === 'lines') {
          return (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((line) =>
              (field.itemFields ?? [])
                .filter((item) => item.required)
                .every((item) => line[item.key] !== '' && line[item.key] !== undefined),
            )
          );
        }
        if (field.type === 'multi-select') {
          return Array.isArray(value) && value.length > 0;
        }
        return value !== '' && value !== null && value !== undefined;
      });
  }

  protected actionLabel(operation: EndpointDefinition): string {
    if (operation.id === 'INV-04') return 'Guardar y continuar';
    if (operation.id === 'INV-05') return 'Aplicar ajuste al inventario';
    if (operation.id === 'GRC-02') return 'Guardar y continuar';
    if (operation.id === 'GRC-03') return 'Cerrar recepción y agregar stock';
    if (operation.method === 'GET') return 'Consultar';
    if (operation.method === 'PUT') return 'Guardar cambios';
    if (/confirm|close/i.test(operation.path)) return 'Confirmar operación';
    if (/cancel/i.test(operation.path)) return 'Confirmar cancelación';
    return 'Completar tarea';
  }

  protected execute(): void {
    const operation = this.selected();
    if (!operation || !this.formComplete()) return;
    this.lastExecutedOperation.set(operation);
    const path: Record<string, string> = {};
    const queryValues: Record<string, string> = {};
    const body: Record<string, unknown> = {};
    for (const field of this.fields()) {
      const value = normalizeValue(field, this.values()[field.key]);
      if (field.source === 'path') path[field.key] = String(value);
      if (field.source === 'query' && value !== '') queryValues[field.key] = String(value);
      if (field.source === 'body') body[field.key] = value;
    }
    this.store.execute(operation, path, queryValues, body, (result) =>
      this.continueWorkflow(operation, result),
    );
  }

  private continueWorkflow(operation: EndpointDefinition, result: unknown): void {
    if (!resultId(result)) return;
    const nextId = operation.id === 'INV-04' ? 'INV-05' : operation.id === 'GRC-02' ? 'GRC-03' : '';
    if (!nextId) return;
    const next = ENDPOINT_CATALOG.find((item) => item.id === nextId);
    if (!next) return;
    this.select(next);
    this.workflowMessage.set(
      nextId === 'INV-05'
        ? 'El ajuste quedó preparado. Confírmalo para que la nueva existencia se aplique al almacén.'
        : 'La recepción quedó preparada. Ciérrala para sumar los productos al inventario.',
    );
  }
}

function operationFamily(operation: EndpointDefinition): string {
  return operation.id.split('-')[0];
}

function resultId(result: unknown): string {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return '';
  const value = (result as Record<string, unknown>)['id'];
  return typeof value === 'string' ? value : '';
}

function newLine(fields: readonly BusinessLineField[]): Record<string, string | number> {
  return Object.fromEntries(
    fields.map((field) => [field.key, field.defaultValue ?? (field.type === 'number' ? 0 : '')]),
  );
}

function normalizeValue(field: BusinessField, value: FieldValue | undefined): unknown {
  if (field.type === 'number') return Number(value) || 0;
  if (field.type === 'date' && typeof value === 'string' && value) {
    return new Date(value).toISOString();
  }
  if (field.type === 'list' && typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (field.type === 'multi-select') return Array.isArray(value) ? value : [];
  return value ?? '';
}

function sentenceCase(value: string): string {
  if (!value) return value;
  return `${value.charAt(0).toLocaleUpperCase('es-MX')}${value.slice(1)}`;
}

function toResultRows(result: unknown): readonly BusinessResultRow[] {
  if (result === null || result === undefined) return [];
  const collection = Array.isArray(result) ? result : [result];
  return collection
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .slice(0, 100)
    .map((item, index) => ({
      id: typeof item['id'] === 'string' ? item['id'] : String(index),
      values: Object.entries(item)
        .filter(
          ([, value]) => !Array.isArray(value) && (typeof value !== 'object' || value === null),
        )
        .slice(0, 8)
        .map(([key, value]) => ({ label: fieldLabel(key), value: formatValue(key, value) })),
    }));
}

function fieldLabel(key: string): string {
  const labels: Record<string, string> = {
    id: 'Referencia',
    name: 'Nombre',
    folio: 'Folio',
    status: 'Estado',
    total: 'Total',
    balance: 'Saldo',
    quantity: 'Cantidad',
    stock: 'Existencia',
    currentStock: 'Existencia',
    createdAt: 'Creado',
    occurredAt: 'Fecha',
    saleDate: 'Fecha',
    issueDate: 'Emisión',
    dueDate: 'Vencimiento',
    email: 'Correo',
    username: 'Usuario',
    warehouseName: 'Almacén',
    productName: 'Producto',
    description: 'Descripción',
    code: 'Código',
    module: 'Módulo',
  };
  return (
    labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
  );
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') {
    if (/total|amount|balance|cost|price|tax|paid|revenue|profit/i.test(key)) {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    }
    return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'string' && /date|at$/i.test(key) && !Number.isNaN(Date.parse(value))) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
  return String(value);
}
