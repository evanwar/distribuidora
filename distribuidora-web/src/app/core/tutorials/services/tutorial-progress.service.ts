import { Injectable, signal } from '@angular/core';
import {
  TutorialDefinition,
  TutorialDisplayProgress,
  TutorialProgress,
} from '../models/tutorial.models';

const STORAGE_KEY = 'distribuidora:tutorial-progress:v1';

@Injectable({ providedIn: 'root' })
export class TutorialProgressService {
  private readonly state = signal<Readonly<Record<string, TutorialProgress>>>(readProgress());

  progressFor(tutorial: TutorialDefinition): TutorialDisplayProgress {
    const stored = this.state()[tutorial.id];
    if (!stored) return emptyProgress(tutorial);
    const updated = stored.version < tutorial.version;
    return {
      ...stored,
      version: tutorial.version,
      status: updated ? 'not-started' : stored.status,
      lastStepId: updated ? undefined : stored.lastStepId,
      updated,
    };
  }

  start(tutorial: TutorialDefinition, stepId: string): void {
    this.write({
      tutorialId: tutorial.id,
      version: tutorial.version,
      status: 'in-progress',
      lastStepId: stepId,
      updatedAt: new Date().toISOString(),
    });
  }

  move(tutorial: TutorialDefinition, stepId: string): void {
    this.start(tutorial, stepId);
  }

  complete(tutorial: TutorialDefinition, stepId: string): void {
    this.write({
      tutorialId: tutorial.id,
      version: tutorial.version,
      status: 'completed',
      lastStepId: stepId,
      updatedAt: new Date().toISOString(),
    });
  }

  dismiss(tutorial: TutorialDefinition, stepId?: string): void {
    const current = this.state()[tutorial.id];
    this.write({
      tutorialId: tutorial.id,
      version: tutorial.version,
      status: current?.status === 'completed' ? 'completed' : 'dismissed',
      lastStepId: stepId ?? current?.lastStepId,
      updatedAt: new Date().toISOString(),
    });
  }

  reset(tutorialId: string): void {
    const next = { ...this.state() };
    delete next[tutorialId];
    this.replace(next);
  }

  resetAll(): void {
    this.replace({});
  }

  private write(progress: TutorialProgress): void {
    this.replace({ ...this.state(), [progress.tutorialId]: progress });
  }

  private replace(value: Readonly<Record<string, TutorialProgress>>): void {
    this.state.set(value);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // El progreso es opcional; el tutorial continúa en memoria.
    }
  }
}

function emptyProgress(tutorial: TutorialDefinition): TutorialDisplayProgress {
  return {
    tutorialId: tutorial.id,
    version: tutorial.version,
    status: 'not-started',
    updatedAt: '',
    updated: false,
  };
}

function readProgress(): Readonly<Record<string, TutorialProgress>> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const valid: Record<string, TutorialProgress> = {};
    for (const [id, candidate] of Object.entries(parsed)) {
      if (isProgress(candidate, id)) valid[id] = candidate;
    }
    return valid;
  } catch {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Un storage bloqueado no debe impedir usar la aplicación.
    }
    return {};
  }
}

function isProgress(value: unknown, id: string): value is TutorialProgress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<TutorialProgress>;
  return (
    item.tutorialId === id &&
    typeof item.version === 'number' &&
    ['not-started', 'in-progress', 'completed', 'dismissed'].includes(item.status ?? '') &&
    typeof item.updatedAt === 'string' &&
    (item.lastStepId === undefined || typeof item.lastStepId === 'string')
  );
}

