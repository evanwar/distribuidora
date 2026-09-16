import { Injectable } from '@angular/core';

export type TutorialTelemetryEvent =
  | 'tutorial_opened'
  | 'tutorial_started'
  | 'tutorial_step_viewed'
  | 'tutorial_completed'
  | 'tutorial_dismissed'
  | 'tutorial_target_missing';

@Injectable({ providedIn: 'root' })
export class TutorialTelemetryService {
  record(
    event: TutorialTelemetryEvent,
    data: Readonly<{ tutorialId: string; version: number; moduleId: string; stepId?: string }>,
  ): void {
    // Punto de extensión intencional. No se agrega un proveedor externo ni se captura PII.
    void event;
    void data;
  }
}
