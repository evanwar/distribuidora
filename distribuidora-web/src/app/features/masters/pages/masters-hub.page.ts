import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UiIconComponent, UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { UiPageHeaderComponent } from '../../../shared/ui/page-header/ui-page-header.component';

@Component({
  selector: 'app-masters-hub-page',
  imports: [RouterLink, MatCardModule, UiIconComponent, UiPageHeaderComponent],
  template: `
    <div class="page">
      <app-ui-page-header
        eyebrow="F02 · Catálogos"
        title="Otros Catálogos"
        subtitle="Clasificación y configuración reutilizada por productos e inventario."
      />
      <section class="hub">
        @for (item of items; track item.path) {
          <a [routerLink]="item.path">
            <mat-card appearance="outlined">
              <mat-card-content>
                <span><app-ui-icon [name]="item.icon" /></span>
                <div>
                  <h2>{{ item.label }}</h2>
                  <p>{{ item.description }}</p>
                </div>
                <app-ui-icon name="open" />
              </mat-card-content>
            </mat-card>
          </a>
        }
      </section>
    </div>
  `,
  styles: `
    .hub { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
    a { text-decoration: none; }
    mat-card { height: 100%; border-radius: var(--app-radius-md); transition: transform 160ms ease, box-shadow 160ms ease; }
    a:hover mat-card { transform: translateY(-2px); box-shadow: var(--app-shadow); }
    mat-card-content { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-5); }
    mat-card-content > span { display: grid; width: 2.75rem; height: 2.75rem; place-items: center; border-radius: var(--app-radius-sm); background: var(--app-surface-muted); color: var(--app-primary); }
    h2 { margin: 0; font-size: 1.1rem; }
    p { margin: var(--space-1) 0 0; color: var(--app-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MastersHubPage {
  protected readonly items: readonly {
    label: string;
    path: string;
    icon: UiIconName;
    description: string;
  }[] = [
    { label: 'Categorías', path: 'categories', icon: 'category', description: 'Clasificación de productos.' },
    { label: 'Marcas', path: 'brands', icon: 'products', description: 'Marcas comerciales.' },
    { label: 'Unidades', path: 'units', icon: 'unit', description: 'Unidades y decimales.' },
    { label: 'Almacenes', path: 'warehouses', icon: 'warehouse', description: 'Almacenes centrales.' },
    { label: 'Aliases de producto', path: 'product-aliases', icon: 'alias', description: 'Códigos alternos.' },
  ];
}
