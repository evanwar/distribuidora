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
import { UiDateFieldComponent } from '../../../shared/ui/date-field/ui-date-field.component';
import { UiIconComponent, UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import { UiStatusChipComponent } from '../../../shared/ui/status-chip/ui-status-chip.component';
import { OperationWorkbenchStore } from '../data-access/operation-workbench.store';
import { BUSINESS_FIELDS, BUSINESS_MODULES, BUSINESS_TITLES } from './business-workspace.config';
import { BusinessField, BusinessLineField, BusinessResultRow } from './business-workspace.models';
import { LanguageService } from '../../../core/i18n/language.service';
import {
  BUSINESS_MODULES_EN,
  BUSINESS_TITLES_EN,
  businessText,
  permissionText,
  systemRoleText,
} from './business-workspace.i18n';
import { ReportVisualizationComponent } from './report-visualization.component';

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
    UiDateFieldComponent,
    UiIconComponent,
    UiIconButtonComponent,
    UiPageHeaderComponent,
    UiStatusChipComponent,
    ReportVisualizationComponent,
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
        <app-ui-alert [title]="text('Siguiente paso')" [message]="workflowMessage()!" tone="info" />
      }

      <section class="workspace">
        <nav class="surface task-nav" [attr.aria-label]="text('Tareas disponibles')">
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
              [title]="text('Selecciona una tarea')"
              [message]="
                text('Elige una opción para consultar información o realizar una operación.')
              "
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
                    ? text('Consulta')
                    : selected()!.method === 'POST'
                      ? text('Registro')
                      : text('Actualización')
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
                        {{ text(field.label) }}
                      </mat-checkbox>
                    } @else if (field.type === 'date') {
                      <app-ui-date-field
                        [label]="text(field.label)"
                        [hint]="text(field.hint ?? '')"
                        [required]="field.required ?? false"
                        [value]="dateValue(field)"
                        (valueChange)="setValue(field.key, $event)"
                      />
                    } @else {
                      <mat-form-field
                        appearance="outline"
                        [class.form-grid__wide]="
                          field.type === 'textarea' ||
                          field.type === 'list' ||
                          field.type === 'multi-select'
                        "
                      >
                        <mat-label>{{ text(field.label) }}</mat-label>
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
                              <mat-option value="">{{ text('Todos') }}</mat-option>
                            }
                            @if (store.lookupLoading()) {
                              <mat-option disabled>{{ text('Cargando opciones…') }}</mat-option>
                            } @else if (store.optionsFor(field).length === 0) {
                              <mat-option disabled>{{
                                text('No hay registros disponibles')
                              }}</mat-option>
                            }
                            @for (option of store.optionsFor(field); track option.value) {
                              <mat-option [value]="option.value">{{
                                optionText(field, option.value, option.label)
                              }}</mat-option>
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
                          <mat-hint>{{ text(field.hint) }}</mat-hint>
                        } @else if (field.type === 'select') {
                          <mat-hint>{{ lookupHint(field) }}</mat-hint>
                        }
                      </mat-form-field>
                    }
                  }
                </div>

                @for (field of lineFields(); track field.key) {
                  <section class="line-editor">
                    <div class="line-editor__header">
                      <div>
                        <h3>{{ text(field.label) }}</h3>
                        <p>
                          {{
                            selected()?.id === 'INV-04'
                              ? text('Captura la existencia real de cada producto.')
                              : text('Agrega una fila por cada elemento.')
                          }}
                        </p>
                      </div>
                      <app-ui-button
                        [label]="text('Agregar')"
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
                                ? text('Producto') + ' ' + (lineIndex + 1)
                                : text('Elemento') + ' ' + (lineIndex + 1)
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
                                <span>{{ text('Existencia') }}:</span>
                                <strong>{{ adjustmentStock(line, productField) }}</strong>
                              </div>
                            }
                            <app-ui-icon-button
                              class="line-editor__remove"
                              icon="close"
                              [ariaLabel]="removeRowLabel(lineIndex)"
                              (pressed)="removeLine(field, lineIndex)"
                            />
                          </div>
                        </div>
                        @for (itemField of field.itemFields ?? []; track itemField.key) {
                          <div class="line-editor__field">
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                              <mat-label>{{ text(itemField.label) }}</mat-label>
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

              @if (emptyRequiredLookup()) {
                <app-ui-feedback
                  kind="empty"
                  [title]="emptyLookupTitle()"
                  [message]="emptyLookupMessage()"
                  [actionLabel]="emptyLookupActionLabel()"
                  (action)="resolveEmptyLookup()"
                />
              }
            } @else {
              <div class="task-panel__actions">
                <app-ui-button
                  [label]="text('Actualizar consulta')"
                  icon="refresh"
                  variant="outlined"
                  [loading]="store.loading()"
                  (pressed)="execute()"
                />
              </div>
            }

            @if (store.error()) {
              <app-ui-alert
                [title]="text('No pudimos completar la tarea')"
                [message]="store.error()!.message"
                tone="danger"
                [correlationId]="store.error()!.correlationId"
                [operationId]="store.error()!.operationId"
              />
            }

            @if (store.loading()) {
              <app-ui-feedback
                kind="loading"
                [title]="text('Consultando información')"
                [message]="text('La operación está en proceso.')"
              />
            } @else if (store.result() !== null) {
              <section class="results" aria-live="polite">
                <div class="results__header">
                  <div>
                    <h3>{{ text('Resultado') }}</h3>
                    <p>
                      {{ resultRows().length }}
                      {{ resultRows().length === 1 ? text('registro') : text('registros') }}
                    </p>
                  </div>
                  <span class="success-mark"
                    ><app-ui-icon name="check" /> {{ text('Operación completada') }}</span
                  >
                </div>
                @if (isReportResult()) {
                  <app-report-visualization
                    [operationId]="selected()!.id"
                    [result]="store.result()"
                    [locale]="i18n.locale()"
                    [english]="english"
                  />
                } @else if (resultRows().length === 0) {
                  <div class="completed-message">
                    <span><app-ui-icon name="check" /></span>
                    <strong>{{ text('La operación se completó correctamente.') }}</strong>
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
  protected readonly i18n = inject(LanguageService);
  protected readonly english = this.i18n.language() === 'en';
  protected readonly store = inject(OperationWorkbenchStore);
  protected readonly definition =
    (this.english ? BUSINESS_MODULES_EN : BUSINESS_MODULES)[
      String(this.route.snapshot.data['moduleKey'])
    ] ?? (this.english ? BUSINESS_MODULES_EN['F03'] : BUSINESS_MODULES['F03']);
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
  protected readonly emptyRequiredLookup = computed(() => {
    if (this.store.lookupLoading()) return undefined;
    return this.scalarFields().find(
      (field) =>
        field.required &&
        (field.type === 'select' || field.type === 'multi-select') &&
        Boolean(field.optionsEndpoint) &&
        this.store.optionsFor(field).length === 0,
    );
  });
  protected readonly resultRows = computed(() =>
    toResultRows(this.store.result(), this.english, this.i18n.locale()),
  );
  protected readonly isReportResult = computed(() => /^(DSH|RPT)-/.test(this.selected()?.id ?? ''));

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

    const requestedOperation = this.route.snapshot.queryParamMap.get('operation');
    const operation = this.operations().find((item) => item.id === requestedOperation);
    if (operation) this.select(operation);
    else if (this.definition.key === 'F08' && this.operations().length > 0) {
      this.select(this.operations()[0]);
    }
  }

  protected operationsFor(group: string): readonly EndpointDefinition[] {
    return this.operations().filter((operation) => this.groupFor(operation) === group);
  }

  protected groupFor(operation: EndpointDefinition): string {
    const matchingKey = Object.keys(this.definition.groups)
      .sort((left, right) => right.length - left.length)
      .find((key) => operation.id.startsWith(key));
    return matchingKey ? this.definition.groups[matchingKey] : this.text('Otras tareas');
  }

  protected titleFor(operation: EndpointDefinition): string {
    if (this.english)
      return BUSINESS_TITLES_EN[operation.id] ?? sentenceCase(operation.description, 'en-US');
    return BUSINESS_TITLES[operation.id] ?? sentenceCase(operation.description, 'es-MX');
  }

  protected shortDescription(operation: EndpointDefinition): string {
    return this.fullDescription(operation);
  }

  protected fullDescription(operation: EndpointDefinition): string {
    if (this.english)
      return `Use this task to ${this.titleFor(operation).toLocaleLowerCase('en-US')}.`;
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

  protected dateValue(field: BusinessField): string {
    const value = this.values()[field.key];
    return typeof value === 'string' ? value : '';
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

  protected lookupHint(field: BusinessField): string {
    if (this.store.lookupLoading()) return this.text('Cargando opciones…');
    if (this.store.optionsFor(field).length === 0) {
      return this.text('No hay registros disponibles para seleccionar.');
    }
    return this.text('Abre la lista; con ella abierta puedes escribir para localizar una opción.');
  }

  protected optionText(
    field: BusinessField | BusinessLineField,
    value: string | number,
    label: string,
  ): string {
    if (field.key === 'permissionKeys') return permissionText(String(value), this.english);
    if (field.optionsEndpoint === '/api/v1/roles') return systemRoleText(label, this.english);
    return label;
  }

  protected emptyLookupTitle(): string {
    const operationId = this.selected()?.id ?? '';
    if (operationId.startsWith('PUR-')) return this.text('Todavía no hay compras');
    if (operationId.startsWith('GRC-')) return this.text('Todavía no hay recepciones');
    if (operationId === 'INV-05' || operationId === 'INV-06') {
      return this.text('Todavía no hay ajustes disponibles');
    }
    return this.text('No hay registros disponibles');
  }

  protected emptyLookupMessage(): string {
    const operationId = this.selected()?.id ?? '';
    if (operationId.startsWith('PUR-')) {
      return this.english
        ? 'First record a purchase order. You can then view, edit, confirm, or cancel it here.'
        : 'Primero registra una orden de compra. Después podrás consultarla, editarla, confirmarla o cancelarla desde aquí.';
    }
    if (operationId.startsWith('GRC-')) {
      return this.english
        ? 'First record a goods receipt so you can view or close it.'
        : 'Primero registra una recepción de mercancía para poder consultarla o cerrarla.';
    }
    if (operationId === 'INV-05' || operationId === 'INV-06') {
      return this.english
        ? 'First record an inventory adjustment so you can confirm or cancel it.'
        : 'Primero registra un ajuste de inventario para poder confirmarlo o cancelarlo.';
    }
    return this.text('Crea el registro requerido y vuelve a intentar esta tarea.');
  }

  protected emptyLookupActionLabel(): string | undefined {
    return this.emptyLookupTargetId() ? this.emptyLookupActionText() : undefined;
  }

  protected resolveEmptyLookup(): void {
    const targetId = this.emptyLookupTargetId();
    const operation = this.operations().find((item) => item.id === targetId);
    if (operation) this.select(operation);
  }

  private emptyLookupTargetId(): string {
    const operationId = this.selected()?.id ?? '';
    if (operationId.startsWith('PUR-') && operationId !== 'PUR-02') return 'PUR-02';
    if (operationId.startsWith('GRC-') && operationId !== 'GRC-02') return 'GRC-02';
    if (operationId === 'INV-05' || operationId === 'INV-06') return 'INV-04';
    return '';
  }

  private emptyLookupActionText(): string {
    const targetId = this.emptyLookupTargetId();
    if (targetId === 'PUR-02') return this.text('Registrar una compra');
    if (targetId === 'GRC-02') return this.text('Registrar una recepción');
    if (targetId === 'INV-04') return this.text('Registrar un ajuste');
    return '';
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
      ? this.text('selecciona almacén y producto')
      : new Intl.NumberFormat(this.i18n.locale(), { maximumFractionDigits: 4 }).format(stock);
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
    if (operation.id === 'INV-04') return this.text('Guardar y continuar');
    if (operation.id === 'INV-05') return this.text('Aplicar ajuste al inventario');
    if (operation.id === 'GRC-02') return this.text('Guardar y continuar');
    if (operation.id === 'GRC-03') return this.text('Cerrar recepción y agregar stock');
    if (operation.method === 'GET') return this.text('Consultar');
    if (operation.method === 'PUT') return this.text('Guardar cambios');
    if (/confirm|close/i.test(operation.path)) return this.text('Confirmar operación');
    if (/cancel/i.test(operation.path)) return this.text('Confirmar cancelación');
    return this.text('Completar tarea');
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
        ? this.english
          ? 'The adjustment is ready. Confirm it to apply the new stock to the warehouse.'
          : 'El ajuste quedó preparado. Confírmalo para que la nueva existencia se aplique al almacén.'
        : this.english
          ? 'The receipt is ready. Close it to add the products to inventory.'
          : 'La recepción quedó preparada. Ciérrala para sumar los productos al inventario.',
    );
  }

  protected text(value: string): string {
    return businessText(value, this.english);
  }

  protected removeRowLabel(index: number): string {
    return this.english ? `Remove row ${index + 1}` : `Quitar fila ${index + 1}`;
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

function sentenceCase(value: string, locale = 'es-MX'): string {
  if (!value) return value;
  return `${value.charAt(0).toLocaleUpperCase(locale)}${value.slice(1)}`;
}

export function toResultRows(
  result: unknown,
  english: boolean,
  locale: string,
): readonly BusinessResultRow[] {
  if (result === null || result === undefined) return [];
  const collection = Array.isArray(result)
    ? result
    : result &&
        typeof result === 'object' &&
        Array.isArray((result as Record<string, unknown>)['items'])
      ? ((result as Record<string, unknown>)['items'] as readonly unknown[])
      : [result];
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
        .map(([key, value]) => ({
          label: fieldLabel(key, english),
          value: formatValue(key, value, english, locale),
        })),
    }));
}

function fieldLabel(key: string, english: boolean): string {
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
    action: 'Acción',
  };
  const label =
    labels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
  return businessText(label, english);
}

function formatValue(key: string, value: unknown, english: boolean, locale: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return businessText(value ? 'Sí' : 'No', english);
  if (typeof value === 'number') {
    if (/total|amount|balance|cost|price|tax|paid|revenue|profit/i.test(key)) {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(value);
    }
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === 'string' && /date|at$/i.test(key) && !Number.isNaN(Date.parse(value))) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
  return String(value);
}
