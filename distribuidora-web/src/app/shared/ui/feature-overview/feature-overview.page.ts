import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiFeedbackComponent } from '../feedback/ui-feedback.component';
import { UiPageHeaderComponent } from '../page-header/ui-page-header.component';

@Component({
  selector: 'app-feature-overview-page',
  imports: [UiFeedbackComponent, UiPageHeaderComponent],
  template: `
    <div class="page">
      <app-ui-page-header
        [eyebrow]="module"
        [title]="title"
        [subtitle]="description"
      />
      <section class="surface">
        <app-ui-feedback
          kind="empty"
          title="Preparando esta operación"
          message="Esta tarea estará disponible próximamente."
          icon="empty"
        />
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureOverviewPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = String(this.route.snapshot.data['title'] ?? 'Módulo');
  protected readonly description = String(
    this.route.snapshot.data['description'] ?? 'Operación del sistema.',
  );
  protected readonly module = String(this.route.snapshot.data['module'] ?? 'MVP');
}
