import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import {
  DataColumn,
  ResponsiveDataViewComponent,
} from '../../../shared/ui/responsive-data-view/responsive-data-view.component';
import { CustomersStore } from '../data-access/customers.store';
import { CustomerVm } from '../models/customer.models';
import { CustomerFormComponent } from '../ui/customer-form/customer-form.component';

@Component({
  selector: 'app-customers-page',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    CustomerFormComponent,
    ResponsiveDataViewComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiFeedbackComponent,
    UiPageHeaderComponent,
  ],
  providers: [CustomersStore],
  template: `
    <div class="page">
      <app-ui-page-header
        eyebrow="F02 · Catálogos"
        title="Clientes"
        subtitle="Información comercial y condiciones de crédito de cada cliente."
      >
        <app-ui-button label="Nuevo cliente" icon="add" (pressed)="openNew()" />
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
            <mat-card-title>{{ selected() ? 'Editar cliente' : 'Nuevo cliente' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-customer-form
              [customer]="selected()"
              [saving]="store.saving()"
              (saved)="store.save(selected()?.id, $event, closeEditor)"
              (cancelled)="closeEditor()"
            />
          </mat-card-content>
        </mat-card>
      }

      <section class="list-controls">
        <mat-form-field appearance="outline">
          <mat-label>Buscar clientes</mat-label>
          <input
            matInput
            [value]="store.query()"
            placeholder="Nombre, RFC, teléfono o correo"
            (input)="store.search(searchValue($event))"
          />
        </mat-form-field>
        <span>{{ store.customers().length }} resultados</span>
      </section>

      @if (store.loading()) {
        <section class="surface">
          <app-ui-feedback
            kind="loading"
            title="Cargando clientes"
            message="Consultando el catálogo."
          />
        </section>
      } @else if (store.customers().length === 0) {
        <section class="surface">
          <app-ui-feedback
            kind="empty"
            title="No hay clientes para mostrar"
            message="Cambia la búsqueda o registra el primer cliente."
            actionLabel="Nuevo cliente"
            (action)="openNew()"
          />
        </section>
      } @else {
        <app-responsive-data-view
          [rows]="store.customers()"
          [columns]="columns"
          activeKey="active"
          (edit)="openEdit($event)"
        />
      }
    </div>
  `,
  styles: `
    mat-card {
      border-radius: var(--app-radius-md);
    }
    mat-card-content {
      padding-top: var(--space-5);
    }
    .list-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }
    .list-controls mat-form-field {
      width: min(100%, 30rem);
    }
    .list-controls span {
      color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage implements OnInit {
  protected readonly store = inject(CustomersStore);
  protected readonly editorOpen = signal(false);
  protected readonly selected = signal<CustomerVm | null>(null);
  protected readonly columns: readonly DataColumn<CustomerVm>[] = [
    { key: 'name', label: 'Cliente', priority: 'primary' },
    { key: 'taxId', label: 'RFC' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    {
      key: 'creditLimit',
      label: 'Límite',
      format: (value) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
          Number(value ?? 0),
        ),
    },
    { key: 'active', label: 'Estado', format: (value) => (value ? 'Activo' : 'Inactivo') },
  ];
  protected readonly closeEditor = (): void => {
    this.editorOpen.set(false);
    this.selected.set(null);
  };

  ngOnInit(): void {
    this.store.load();
  }

  protected openNew(): void {
    this.selected.set(null);
    this.editorOpen.set(true);
  }

  protected openEdit(customer: CustomerVm): void {
    this.selected.set(customer);
    this.editorOpen.set(true);
  }

  protected searchValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
