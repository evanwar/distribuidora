import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LanguageService } from '../../i18n/language.service';
import { TutorialDefinition, TutorialModuleId } from '../models/tutorial.models';
import { TUTORIAL_MODULE_ORDER } from '../registry/tutorial-registry';
import { TutorialProgressService } from '../services/tutorial-progress.service';

export interface TutorialCenterData {
  readonly tutorials: readonly TutorialDefinition[];
  readonly currentModule?: TutorialModuleId;
}

@Component({
  selector: 'app-tutorial-center',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  template: `
    <header class="tutorial-center__header">
      <div>
        <span>{{ text('AYUDA GUIADA', 'GUIDED HELP') }}</span>
        <h2 mat-dialog-title>{{ text('Centro de tutoriales', 'Tutorial center') }}</h2>
        <p>{{ text('Aprende cada módulo a tu ritmo. Ningún recorrido modifica información.', 'Learn each module at your own pace. Tours never change data.') }}</p>
      </div>
      <button matIconButton mat-dialog-close type="button" [attr.aria-label]="text('Cerrar tutoriales', 'Close tutorials')">×</button>
    </header>

    @if (data.tutorials.length > 0) {
      <section class="tutorial-search" role="search" [attr.aria-label]="text('Buscar tutoriales', 'Search tutorials')">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ text('Buscar un proceso', 'Search for a process') }}</mat-label>
          <input
            matInput
            type="search"
            autocomplete="off"
            [value]="query()"
            [placeholder]="text('Ej. producto, compra, tarjeta o cliente', 'E.g. product, purchase, card, or customer')"
            (input)="updateSearch($event)"
          />
          @if (query()) {
            <button matIconButton matSuffix type="button" (click)="clearSearch()" [attr.aria-label]="text('Limpiar búsqueda', 'Clear search')">×</button>
          }
        </mat-form-field>
        <small aria-live="polite">{{ resultLabel() }}</small>
      </section>
    }

    <mat-dialog-content>

      @if (data.tutorials.length === 0) {
        <section class="empty">
          <h3>{{ text('No hay tutoriales disponibles', 'No tutorials available') }}</h3>
          <p>{{ text('Tu cuenta no tiene acceso a módulos con recorridos guiados.', 'Your account cannot access modules with guided tours.') }}</p>
        </section>
      } @else if (groups().length === 0) {
        <section class="empty" aria-live="polite">
          <h3>{{ text('No encontramos ese tutorial', 'No matching tutorial found') }}</h3>
          <p>{{ text('Prueba palabras como producto, compra, tarjeta, cliente o inventario.', 'Try words such as product, purchase, card, customer, or inventory.') }}</p>
          <button matButton="filled" type="button" (click)="clearSearch()">{{ text('Ver todos los tutoriales', 'View all tutorials') }}</button>
        </section>
      }
      @for (group of groups(); track group.moduleId) {
        <section class="tutorial-group" [attr.data-current-module]="group.moduleId === data.currentModule || null">
          <header>
            <div>
              <span>{{ group.moduleId === 'shell' ? text('GENERAL', 'GENERAL') : group.moduleId }}</span>
              <h3>{{ moduleName(group.moduleId) }}</h3>
            </div>
            <small>{{ group.tutorials.length }} {{ text(group.tutorials.length === 1 ? 'recorrido' : 'recorridos', group.tutorials.length === 1 ? 'tour' : 'tours') }}</small>
          </header>
          <div class="tutorial-list">
            @for (tutorial of group.tutorials; track tutorial.id) {
              <article>
                <div class="tutorial-copy">
                  <div class="tutorial-title-row">
                    <h4>{{ localized(tutorial.title) }}</h4>
                    @if (tutorial.featured) {
                      <span class="featured">{{ text('PROCESO ESENCIAL', 'ESSENTIAL PROCESS') }}</span>
                    }
                    <span class="status" [attr.data-status]="progressService.progressFor(tutorial).status">
                      {{ statusLabel(tutorial) }}
                    </span>
                  </div>
                  <p>{{ localized(tutorial.description) }}</p>
                  <div class="tutorial-meta">
                    <span>{{ tutorial.steps.length }} {{ text('pasos', 'steps') }}</span>
                    <span>·</span>
                    <span>{{ tutorial.estimatedMinutes }} min</span>
                  </div>
                  @if (progressService.progressFor(tutorial).status === 'in-progress' || progressService.progressFor(tutorial).status === 'dismissed') {
                    <mat-progress-bar mode="determinate" [value]="progressValue(tutorial)" />
                  }
                </div>
                <div class="tutorial-actions">
                  @if (progressService.progressFor(tutorial).status !== 'not-started' || progressService.progressFor(tutorial).updated) {
                    <button matButton type="button" (click)="reset(tutorial.id)">{{ text('Reiniciar', 'Reset') }}</button>
                  }
                  <button matButton="filled" type="button" (click)="launch(tutorial.id)">
                    {{ actionLabel(tutorial) }}
                  </button>
                </div>
              </article>
            }
          </div>
        </section>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (hasProgress()) {
        <button matButton type="button" [class.confirm-reset]="confirmResetAll()" (click)="resetAll()">
          {{ confirmResetAll() ? text('Confirmar reinicio', 'Confirm reset') : text('Reiniciar todo', 'Reset all') }}
        </button>
      }
      <button matButton mat-dialog-close type="button">{{ text('Cerrar', 'Close') }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    :host { display: flex; min-height: 0; max-height: 96dvh; flex-direction: column; overflow: hidden; }
    .tutorial-center__header { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: var(--space-4); padding: var(--space-5) var(--space-5) var(--space-4); background: linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 7%, var(--app-bg)), var(--app-bg) 55%); }
    .tutorial-center__header h2 { margin: .2rem 0 0; padding: 0; font-size: clamp(1.45rem, 4vw, 2rem); }
    .tutorial-center__header p { max-width: 58ch; margin: var(--space-2) 0 0; color: var(--app-text-muted); }
    .tutorial-center__header span, .tutorial-group > header span { color: var(--app-primary); font-size: .7rem; font-weight: 800; letter-spacing: .09em; }
    .tutorial-center__header button { flex: 0 0 auto; font-size: 1.5rem; }
    mat-dialog-content { display: grid; min-width: min(46rem, calc(100vw - 3rem)); min-height: 0; flex: 1 1 auto; gap: var(--space-5); padding-block: var(--space-4) var(--space-5); overscroll-behavior: contain; }
    .tutorial-search { display: grid; flex: 0 0 auto; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: 0 var(--space-5) var(--space-4); border-bottom: 1px solid var(--app-border); background: var(--app-bg); }
    .tutorial-search mat-form-field { width: 100%; }
    .tutorial-search small { min-width: 7rem; padding: .45rem .7rem; border-radius: var(--app-radius-pill); background: var(--app-surface-muted); color: var(--app-text-muted); font-weight: 700; text-align: center; }
    .tutorial-group { display: grid; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--app-border); border-radius: var(--app-radius-md); background: var(--app-surface); box-shadow: 0 1px 2px color-mix(in srgb, var(--app-text) 5%, transparent); }
    .tutorial-group[data-current-module='true'] { border-color: color-mix(in srgb, var(--app-primary) 40%, var(--app-border)); box-shadow: inset 3px 0 var(--app-primary); }
    .tutorial-group > header, .tutorial-title-row, .tutorial-meta, .tutorial-actions { display: flex; align-items: center; gap: var(--space-2); }
    .tutorial-group > header { justify-content: space-between; }
    .tutorial-group h3, h4 { margin: 0; }
    .tutorial-group small, .tutorial-meta { color: var(--app-text-muted); }
    .tutorial-list { display: grid; gap: var(--space-3); }
    article { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-4); border: 1px solid transparent; border-radius: var(--app-radius-sm); background: var(--app-surface-muted); }
    article:hover { border-color: color-mix(in srgb, var(--app-primary) 18%, var(--app-border)); }
    .tutorial-copy { min-width: 0; flex: 1; }
    article p { margin: var(--space-2) 0; color: var(--app-text-muted); }
    .tutorial-title-row { flex-wrap: wrap; }
    .status, .featured { padding: .2rem .55rem; border-radius: var(--app-radius-pill); background: var(--app-surface); color: var(--app-text-muted); font-size: .72rem; font-weight: 700; }
    .featured { color: var(--app-primary); background: color-mix(in srgb, var(--app-primary) 10%, var(--app-surface)); letter-spacing: .04em; }
    .status[data-status='completed'] { color: var(--app-success); }
    .status[data-status='in-progress'], .status[data-status='dismissed'] { color: var(--app-info); }
    mat-progress-bar { margin-top: var(--space-3); }
    .tutorial-actions { flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; }
    .confirm-reset { color: var(--app-danger); }
    .empty { padding: var(--space-6); text-align: center; }
    mat-dialog-actions { flex: 0 0 auto; gap: var(--space-2); margin: 0; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--app-border); background: var(--app-bg); }
    @media (max-width: 37.5rem) {
      .tutorial-center__header { padding: var(--space-4); }
      .tutorial-center__header p { font-size: .9rem; }
      mat-dialog-content { min-width: 0; padding: var(--space-3); }
      .tutorial-search { grid-template-columns: 1fr; gap: var(--space-2); padding: 0 var(--space-4) var(--space-3); }
      .tutorial-search small { min-width: 0; justify-self: start; }
      .tutorial-group { padding: var(--space-3); }
      article { align-items: stretch; flex-direction: column; }
      .tutorial-actions { justify-content: stretch; }
      .tutorial-actions button { flex: 1; min-height: 3rem; }
      mat-dialog-actions { padding-inline: var(--space-4); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialCenterComponent {
  protected readonly data = inject<TutorialCenterData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TutorialCenterComponent, string>);
  private readonly i18n = inject(LanguageService);
  protected readonly progressService = inject(TutorialProgressService);
  protected readonly confirmResetAll = signal(false);
  protected readonly query = signal('');
  private readonly filteredTutorials = computed(() => {
    const query = normalizeSearch(this.query());
    if (!query) return this.data.tutorials;
    return this.data.tutorials.filter((tutorial) => {
      const content = [
        tutorial.id,
        tutorial.moduleId,
        this.moduleName(tutorial.moduleId),
        tutorial.title.es,
        tutorial.title.en,
        tutorial.description.es,
        tutorial.description.en,
        ...tutorial.steps.flatMap((step) => [step.title.es, step.title.en, step.description.es, step.description.en]),
      ].join(' ');
      return normalizeSearch(content).includes(query);
    });
  });
  protected readonly groups = computed(() => {
    const order = this.data.currentModule
      ? [this.data.currentModule, ...TUTORIAL_MODULE_ORDER.filter((id) => id !== this.data.currentModule)]
      : TUTORIAL_MODULE_ORDER;
    return order
      .map((moduleId) => ({
        moduleId,
        tutorials: this.filteredTutorials()
          .filter((item) => item.moduleId === moduleId)
          .sort((left, right) => Number(right.featured ?? false) - Number(left.featured ?? false)),
      }))
      .filter((group) => group.tutorials.length > 0);
  });
  protected readonly hasProgress = computed(() =>
    this.data.tutorials.some((tutorial) => this.progressService.progressFor(tutorial).status !== 'not-started'),
  );

  protected launch(id: string): void { this.dialogRef.close(id); }
  protected updateSearch(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  protected clearSearch(): void { this.query.set(''); }
  protected resultLabel(): string {
    const count = this.filteredTutorials().length;
    return `${count} ${this.text(count === 1 ? 'tutorial' : 'tutoriales', count === 1 ? 'tutorial' : 'tutorials')}`;
  }
  protected reset(id: string): void { this.progressService.reset(id); }
  protected resetAll(): void {
    if (!this.confirmResetAll()) { this.confirmResetAll.set(true); return; }
    this.progressService.resetAll();
    this.confirmResetAll.set(false);
  }
  protected localized(value: Readonly<{ es: string; en: string }>): string { return this.i18n.language() === 'en' ? value.en : value.es; }
  protected text(es: string, en: string): string { return this.i18n.language() === 'en' ? en : es; }
  protected moduleName(id: TutorialModuleId): string {
    const names: Record<TutorialModuleId, readonly [string, string]> = {
      shell: ['Primeros pasos', 'Getting started'], F01: ['Usuarios y permisos', 'Users and permissions'],
      F02: ['Catálogos', 'Catalogs'], F03: ['Inventario', 'Inventory'], F04: ['Compras', 'Purchases'],
      F05: ['Punto de venta', 'Point of sale'], F06: ['Cobranza', 'Collections'], F07: ['Auditoría y soporte', 'Audit and support'],
      F08: ['Dashboard y reportes', 'Dashboard and reports'], F09: ['Administración', 'Administration'],
    };
    return this.text(...names[id]);
  }
  protected statusLabel(tutorial: TutorialDefinition): string {
    const progress = this.progressService.progressFor(tutorial);
    if (progress.updated) return this.text('Actualizado', 'Updated');
    const labels = {
      'not-started': this.text('No iniciado', 'Not started'),
      'in-progress': this.text('En progreso', 'In progress'),
      completed: this.text('Completado', 'Completed'),
      dismissed: this.text('En pausa', 'Paused'),
    };
    return labels[progress.status];
  }
  protected actionLabel(tutorial: TutorialDefinition): string {
    const status = this.progressService.progressFor(tutorial).status;
    if (status === 'completed') return this.text('Repetir', 'Repeat');
    if (status === 'in-progress' || status === 'dismissed') return this.text('Continuar', 'Continue');
    return this.text('Iniciar', 'Start');
  }
  protected progressValue(tutorial: TutorialDefinition): number {
    const progress = this.progressService.progressFor(tutorial);
    const index = tutorial.steps.findIndex((step) => step.id === progress.lastStepId);
    return index < 0 ? 0 : ((index + 1) / tutorial.steps.length) * 100;
  }
}

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
}
