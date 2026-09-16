import { TestBed } from '@angular/core/testing';
import { TutorialDefinition } from '../models/tutorial.models';
import { TutorialProgressService } from './tutorial-progress.service';

const tutorial: TutorialDefinition = {
  id: 'test-tour',
  moduleId: 'shell',
  version: 2,
  title: { es: 'Prueba', en: 'Test' },
  description: { es: 'Recorrido de prueba', en: 'Test tour' },
  estimatedMinutes: 1,
  route: '/dashboard',
  steps: [
    {
      id: 'first', selector: '[data-tour="first"]',
      title: { es: 'Primero', en: 'First' }, description: { es: 'Inicio', en: 'Start' },
    },
    {
      id: 'second', selector: '[data-tour="second"]',
      title: { es: 'Segundo', en: 'Second' }, description: { es: 'Fin', en: 'End' },
    },
  ],
};

describe('TutorialProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('distinguishes progress, dismissal, completion, and reset', () => {
    const service = TestBed.inject(TutorialProgressService);
    expect(service.progressFor(tutorial).status).toBe('not-started');

    service.start(tutorial, 'first');
    expect(service.progressFor(tutorial)).toMatchObject({ status: 'in-progress', lastStepId: 'first' });

    service.dismiss(tutorial, 'second');
    expect(service.progressFor(tutorial)).toMatchObject({ status: 'dismissed', lastStepId: 'second' });

    service.complete(tutorial, 'second');
    expect(service.progressFor(tutorial).status).toBe('completed');

    service.reset(tutorial.id);
    expect(service.progressFor(tutorial).status).toBe('not-started');
  });

  it('marks an older stored definition as updated', () => {
    localStorage.setItem(
      'distribuidora:tutorial-progress:v1',
      JSON.stringify({
        [tutorial.id]: {
          tutorialId: tutorial.id,
          version: 1,
          status: 'completed',
          lastStepId: 'second',
          updatedAt: new Date().toISOString(),
        },
      }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(TutorialProgressService);

    expect(service.progressFor(tutorial)).toMatchObject({
      status: 'not-started', updated: true, lastStepId: undefined,
    });
  });

  it('discards corrupted storage without throwing', () => {
    localStorage.setItem('distribuidora:tutorial-progress:v1', '{broken');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(TutorialProgressService);

    expect(service.progressFor(tutorial).status).toBe('not-started');
    expect(localStorage.getItem('distribuidora:tutorial-progress:v1')).toBeNull();
  });
});

