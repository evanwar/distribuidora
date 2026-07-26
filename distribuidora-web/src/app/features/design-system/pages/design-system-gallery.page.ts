import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiActionBarComponent } from '../../../shared/ui/action-bar/ui-action-bar.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiIconButtonComponent } from '../../../shared/ui/button/ui-icon-button.component';
import { UiFeedbackComponent } from '../../../shared/ui/feedback/ui-feedback.component';
import { UiMoneyComponent } from '../../../shared/ui/format/ui-money.component';
import { UiIconComponent, UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';
import {
  DataColumn,
  ResponsiveDataViewComponent,
} from '../../../shared/ui/responsive-data-view/responsive-data-view.component';
import { UiStatusChipComponent } from '../../../shared/ui/status-chip/ui-status-chip.component';

@Component({
  selector: 'app-design-system-gallery',
  imports: [
    UiAlertComponent,
    UiActionBarComponent,
    UiButtonComponent,
    UiIconButtonComponent,
    UiFeedbackComponent,
    UiIconComponent,
    UiMoneyComponent,
    UiPageHeaderComponent,
    ResponsiveDataViewComponent,
    UiStatusChipComponent,
  ],
  template: `
    <main class="page">
      <app-ui-page-header
        eyebrow="F0 · Sistema visual"
        title="Componentes de Distribuidora"
        subtitle="Variantes configurables, estados y contenido real."
      />

      <section class="surface sample">
        <h2>Acciones</h2>
        <div class="row">
          <app-ui-button label="Guardar cliente" icon="add" />
          <app-ui-button label="Editar" variant="outlined" />
          <app-ui-button label="Cancelar venta" variant="outlined" tone="danger" />
          <app-ui-button label="Procesando" [loading]="true" />
          <app-ui-button label="No disponible" [disabled]="true" />
          <app-ui-icon-button icon="edit" ariaLabel="Editar registro" />
          <app-ui-icon-button icon="close" ariaLabel="Cerrar" [disabled]="true" />
        </div>
      </section>

      <section class="surface sample">
        <h2>Iconografía</h2>
        <div class="icon-grid">
          @for (item of icons; track item.name) {
            <div>
              <span><app-ui-icon [name]="item.name" /></span>
              <small>{{ item.label }}</small>
            </div>
          }
        </div>
      </section>

      <section class="surface sample">
        <h2>Estados</h2>
        <div class="row">
          <app-ui-status-chip label="Confirmado" tone="success" icon="check" />
          <app-ui-status-chip label="Pendiente" tone="warning" icon="warning" />
          <app-ui-status-chip label="Cancelado" tone="danger" icon="close" />
          <app-ui-money [amount]="128945.5" />
        </div>
      </section>

      <section class="sample">
        <app-ui-alert
          title="Información actualizada"
          message="El inventario refleja la última confirmación del sistema."
          tone="success"
        />
        <app-ui-alert
          title="No se pudo confirmar"
          message="Revisa el estado del documento antes de intentarlo nuevamente."
          tone="danger"
          correlationId="demo-correlation-id"
          actionLabel="Reintentar"
        />
      </section>

      <section class="surface">
        <app-ui-feedback
          kind="empty"
          title="Todavía no hay movimientos"
          message="Los movimientos aparecerán después de confirmar una operación."
          actionLabel="Crear operación"
          (action)="interactions.update((value) => value + 1)"
        />
      </section>

      <section class="surface sample">
        <h2>Vista responsive de datos</h2>
        <app-responsive-data-view
          [rows]="sampleRows"
          [columns]="sampleColumns"
          activeKey="active"
        />
        <app-ui-action-bar>
          <app-ui-button label="Cancelar" variant="text" tone="neutral" />
          <app-ui-button label="Guardar cambios" icon="check" />
        </app-ui-action-bar>
      </section>
    </main>
  `,
  styles: `
    main { padding: var(--space-5); }
    .sample { display: grid; gap: var(--space-4); padding: var(--space-5); }
    .sample h2 { margin: 0; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .icon-grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); }
    .icon-grid div { display: grid; justify-items: center; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--app-border); border-radius: var(--app-radius-sm); }
    .icon-grid span { display: grid; width: 3rem; height: 3rem; place-items: center; border-radius: var(--app-radius-sm); background: var(--app-surface-muted); color: var(--app-primary); }
    .icon-grid app-ui-icon { width: 1.5rem; height: 1.5rem; }
    .icon-grid small { color: var(--app-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSystemGalleryPage {
  protected readonly interactions = signal(0);
  protected readonly icons: readonly { name: UiIconName; label: string }[] = [
    { name: 'add', label: 'Agregar' },
    { name: 'edit', label: 'Editar' },
    { name: 'search', label: 'Consultar' },
    { name: 'refresh', label: 'Actualizar' },
    { name: 'check', label: 'Confirmar' },
    { name: 'warning', label: 'Advertencia' },
    { name: 'print', label: 'Imprimir' },
    { name: 'close', label: 'Cerrar' },
  ];
  protected readonly sampleRows = [
    { id: 'sample-1', sku: 'ARZ-001', name: 'Arroz premium', active: true },
  ];
  protected readonly sampleColumns: readonly DataColumn<(typeof this.sampleRows)[number]>[] = [
    { key: 'sku', label: 'SKU', priority: 'primary' },
    { key: 'name', label: 'Nombre', priority: 'secondary' },
  ];
}
