import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LanguageService } from '../../i18n/language.service';
import { UiIconComponent } from '../../../shared/ui/icon/ui-icon.component';
import { TutorialModuleId } from '../models/tutorial.models';
import { TutorialRegistry } from '../registry/tutorial-registry';
import { TutorialOrchestratorService } from '../services/tutorial-orchestrator.service';
import { TutorialTelemetryService } from '../services/tutorial-telemetry.service';
import { TutorialCenterComponent, TutorialCenterData } from './tutorial-center.component';

@Component({
  selector: 'app-tutorial-launcher',
  imports: [MatButtonModule, MatTooltipModule, UiIconComponent],
  template: `
    <button
      matIconButton
      type="button"
      data-tour="help-launcher"
      [attr.aria-label]="i18n.language() === 'en' ? 'Tutorials and help' : 'Tutoriales y ayuda'"
      [matTooltip]="i18n.language() === 'en' ? 'Tutorials and help' : 'Tutoriales y ayuda'"
      (click)="open()"
    >
      <app-ui-icon name="help" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialLauncherComponent {
  private readonly dialog = inject(MatDialog);
  protected readonly i18n = inject(LanguageService);
  private readonly orchestrator = inject(TutorialOrchestratorService);
  private readonly registry = inject(TutorialRegistry);
  private readonly router = inject(Router);
  private readonly telemetry = inject(TutorialTelemetryService);

  protected open(): void {
    const tutorials = this.registry.available();
    this.telemetry.record('tutorial_opened', {
      tutorialId: 'tutorial-center', version: 1, moduleId: this.currentModule() ?? 'shell',
    });
    this.dialog
      .open<TutorialCenterComponent, TutorialCenterData, string>(TutorialCenterComponent, {
        data: { tutorials, currentModule: this.currentModule() },
        width: 'min(52rem, calc(100vw - 1rem))',
        maxWidth: '100vw',
        maxHeight: '96dvh',
        autoFocus: 'dialog',
        restoreFocus: true,
        panelClass: 'tutorial-center-dialog',
      })
      .afterClosed()
      .subscribe((tutorialId) => {
        if (tutorialId) void this.orchestrator.start(tutorialId);
      });
  }

  private currentModule(): TutorialModuleId | undefined {
    const path = this.router.url.split('?')[0];
    if (path === '/dashboard') return 'shell';
    if (path.startsWith('/customers') || path.startsWith('/suppliers') || path.startsWith('/products') || path.startsWith('/masters')) return 'F02';
    if (path.includes('/security')) return 'F01';
    if (path.includes('/inventory')) return 'F03';
    if (path.includes('/purchases')) return 'F04';
    if (path.includes('/counter-sales')) return 'F05';
    if (path.includes('/receivables')) return 'F06';
    if (path.includes('/audit')) return 'F07';
    if (path.includes('/reports')) return 'F08';
    if (path.includes('/administration')) return 'F09';
    return undefined;
  }
}
