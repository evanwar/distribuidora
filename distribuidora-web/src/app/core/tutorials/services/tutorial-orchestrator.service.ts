import { ApplicationRef, DOCUMENT, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import type { DriveStep, Driver } from 'driver.js';
import { filter, firstValueFrom } from 'rxjs';
import { LanguageService } from '../../i18n/language.service';
import { TutorialDefinition, TutorialStepDefinition } from '../models/tutorial.models';
import { TutorialRegistry } from '../registry/tutorial-registry';
import { TOUR_SELECTORS, tutorialSelector } from '../registry/tutorial-selectors';
import { TutorialProgressService } from './tutorial-progress.service';
import { TutorialTelemetryService } from './tutorial-telemetry.service';

@Injectable({ providedIn: 'root' })
export class TutorialOrchestratorService {
  private readonly appRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(LanguageService);
  private readonly registry = inject(TutorialRegistry);
  private readonly progress = inject(TutorialProgressService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly telemetry = inject(TutorialTelemetryService);
  private active?: Driver;
  private activeTutorial?: TutorialDefinition;
  private activeSteps: readonly TutorialStepDefinition[] = [];
  private completed = false;
  private restoreFocus?: HTMLElement;

  async start(tutorialId: string): Promise<boolean> {
    const tutorial = this.registry.find(tutorialId);
    if (!tutorial || tutorial.steps.length === 0) return false;
    if (this.router.url.split('?')[0] !== tutorial.route && this.hasUnfinishedInput()) {
      this.snackBar.open(
        this.localize(
          'Termina o descarta la captura actual antes de abrir un tutorial de otro módulo.',
          'Finish or discard the current entry before opening a tutorial from another module.',
        ),
        this.localize('Entendido', 'Got it'),
        { duration: 6000 },
      );
      return false;
    }

    this.destroy();
    this.restoreFocus = this.currentFocus();
    await this.navigate(tutorial.route);
    const steps = this.resolveSteps(tutorial);
    if (steps.definitions.length === 0) return false;

    const { driver } = await import('driver.js');
    this.activeTutorial = tutorial;
    this.activeSteps = steps.definitions;
    this.completed = false;
    const instance = driver({
      steps: steps.driverSteps,
      animate: !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      smoothScroll: true,
      allowClose: true,
      allowScroll: true,
      allowKeyboardControl: true,
      overlayClickBehavior: () => {
        instance.destroy();
        this.focusHelpLauncher();
      },
      stagePadding: 10,
      stageRadius: 12,
      popoverOffset: 12,
      popoverClass: 'distribuidora-tour',
      disableActiveInteraction: true,
      showProgress: true,
      progressText: this.localize('Paso {{current}} de {{total}}', 'Step {{current}} of {{total}}'),
      nextBtnText: this.localize('Siguiente', 'Next'),
      prevBtnText: this.localize('Anterior', 'Previous'),
      doneBtnText: this.localize('Finalizar', 'Finish'),
      onPopoverRender: (popover) => {
        const closeLabel = this.localize('Cerrar tutorial', 'Close tutorial');
        popover.closeButton.setAttribute('aria-label', closeLabel);
        popover.closeButton.setAttribute('title', closeLabel);
        popover.wrapper.setAttribute('role', 'dialog');
        popover.wrapper.setAttribute('aria-live', 'polite');
      },
      onHighlighted: (_element, _step, options) => this.onStep(options.index),
      onDoneClick: () => {
        const last = this.activeSteps.at(-1);
        if (last) this.progress.complete(tutorial, last.id);
        this.completed = true;
        this.telemetry.record('tutorial_completed', this.eventData(tutorial, last?.id));
        instance.destroy();
        this.focusHelpLauncher();
      },
      onCloseClick: () => {
        instance.destroy();
        this.focusHelpLauncher();
      },
      onDestroyed: () => this.afterDestroyed(tutorial),
    });
    this.active = instance;

    const saved = this.progress.progressFor(tutorial);
    const savedIndex = saved.lastStepId
      ? this.activeSteps.findIndex((stepDefinition) => stepDefinition.id === saved.lastStepId)
      : -1;
    const startIndex = saved.status === 'in-progress' || saved.status === 'dismissed'
      ? Math.max(0, savedIndex)
      : 0;
    this.progress.start(tutorial, this.activeSteps[startIndex].id);
    this.telemetry.record('tutorial_started', this.eventData(tutorial));
    instance.drive(startIndex);
    return true;
  }

  destroy(): void {
    this.active?.destroy();
    this.active = undefined;
  }

  private resolveSteps(tutorial: TutorialDefinition): {
    definitions: readonly TutorialStepDefinition[];
    driverSteps: DriveStep[];
  } {
    const definitions: TutorialStepDefinition[] = [];
    const driverSteps: DriveStep[] = [];
    for (const definition of tutorial.steps) {
      const target = this.document.querySelector(definition.selector);
      if (!target && definition.optional) continue;
      if (!target) {
        this.telemetry.record('tutorial_target_missing', this.eventData(tutorial, definition.id));
      }
      definitions.push(definition);
      driverSteps.push({
        element: target ?? undefined,
        disableActiveInteraction: !definition.allowInteraction,
        popover: {
          title: this.localizedText(definition.title),
          description: target
            ? this.localizedText(definition.description)
            : `${this.localizedText(definition.description)} ${this.localize(
                'Esta sección no está visible en este momento; puedes continuar con el recorrido.',
                'This section is not visible right now; you can continue the tour.',
              )}`,
          side: definition.placement ?? 'bottom',
          align: definition.align ?? 'start',
        },
      });
    }
    return { definitions, driverSteps };
  }

  private async navigate(route: string): Promise<void> {
    if (this.router.url.split('?')[0] !== route) {
      const completed = firstValueFrom(
        this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
      );
      const accepted = await this.router.navigateByUrl(route);
      if (accepted) await completed;
    }
    await this.appRef.whenStable();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private onStep(index: number | undefined): void {
    const tutorial = this.activeTutorial;
    const step = index === undefined ? undefined : this.activeSteps[index];
    if (!tutorial || !step) return;
    this.progress.move(tutorial, step.id);
    this.telemetry.record('tutorial_step_viewed', this.eventData(tutorial, step.id));
  }

  private afterDestroyed(tutorial: TutorialDefinition): void {
    if (!this.completed) {
      const index = this.active?.getActiveIndex();
      const step = index === undefined ? undefined : this.activeSteps[index];
      this.progress.dismiss(tutorial, step?.id);
      this.telemetry.record('tutorial_dismissed', this.eventData(tutorial, step?.id));
    }
    this.active = undefined;
    this.activeTutorial = undefined;
    this.activeSteps = [];
    this.focusHelpLauncher();
    this.restoreFocus = undefined;
  }

  private hasUnfinishedInput(): boolean {
    return Boolean(
      this.document.querySelector('form.ng-dirty') ||
        this.document.querySelector(`${tutorialSelector(TOUR_SELECTORS.posCart)} .cart-line`),
    );
  }

  private currentFocus(): HTMLElement | undefined {
    const active = this.document.activeElement;
    return active instanceof HTMLElement && active !== this.document.body ? active : undefined;
  }

  private focusHelpLauncher(): void {
    const launcher = tutorialSelector(TOUR_SELECTORS.helpLauncher);
    const focusTarget =
      this.document.querySelector<HTMLElement>(`${launcher} button, button${launcher}`) ??
      (this.restoreFocus?.isConnected ? this.restoreFocus : undefined);
    if (focusTarget) {
      requestAnimationFrame(() => requestAnimationFrame(() => focusTarget.focus({ preventScroll: true })));
    }
  }

  private localizedText(text: Readonly<{ es: string; en: string }>): string {
    return this.i18n.language() === 'en' ? text.en : text.es;
  }

  private localize(es: string, en: string): string {
    return this.i18n.language() === 'en' ? en : es;
  }

  private eventData(tutorial: TutorialDefinition, stepId?: string) {
    return { tutorialId: tutorial.id, version: tutorial.version, moduleId: tutorial.moduleId, stepId };
  }
}
