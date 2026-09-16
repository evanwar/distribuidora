import { TestBed } from '@angular/core/testing';
import { PermissionService } from '../../permissions/permission.service';
import { ALL_TUTORIALS, TUTORIAL_MODULE_ORDER, TutorialRegistry } from './tutorial-registry';

describe('TutorialRegistry', () => {
  it('covers the shell and every module with stable unique ids', () => {
    const modules = new Set(ALL_TUTORIALS.map((tutorial) => tutorial.moduleId));
    expect([...modules].sort()).toEqual([...TUTORIAL_MODULE_ORDER].sort());
    expect(new Set(ALL_TUTORIALS.map((tutorial) => tutorial.id)).size).toBe(ALL_TUTORIALS.length);
    expect(ALL_TUTORIALS.every((tutorial) => tutorial.steps.length > 0)).toBe(true);
  });

  it('includes detailed essential processes for daily operations', () => {
    const essentialIds = ['f02-customers', 'f02-products', 'f04-purchase', 'f05-card-payment'];
    const essentials = ALL_TUTORIALS.filter((tutorial) => essentialIds.includes(tutorial.id));

    expect(essentials.map((tutorial) => tutorial.id)).toEqual(essentialIds);
    expect(essentials.every((tutorial) => tutorial.featured)).toBe(true);
    expect(essentials.every((tutorial) => tutorial.steps.length >= 8)).toBe(true);
  });

  it('filters restricted modules while preserving general help', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PermissionService, useValue: { has: () => false } }],
    });
    const registry = TestBed.inject(TutorialRegistry);

    expect(registry.available().map((tutorial) => tutorial.moduleId)).toEqual(['shell']);
  });

  it('shows every module to a wildcard session', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PermissionService, useValue: { has: () => true } }],
    });
    const registry = TestBed.inject(TutorialRegistry);

    expect(new Set(registry.available().map((tutorial) => tutorial.moduleId)).size).toBe(10);
  });

  it('shows the product registration tutorial with the real catalog permission', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PermissionService, useValue: { has: (permission?: string) => permission === 'catalogs.view' } }],
    });
    const registry = TestBed.inject(TutorialRegistry);

    expect(registry.find('f02-products')?.title.es).toBe('Cómo registrar un producto');
    expect(registry.available().filter((tutorial) => tutorial.moduleId === 'F02').length).toBe(3);
  });
});
