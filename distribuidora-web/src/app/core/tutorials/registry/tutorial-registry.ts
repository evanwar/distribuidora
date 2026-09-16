import { computed, inject, Injectable } from '@angular/core';
import { PermissionService } from '../../permissions/permission.service';
import { TutorialDefinition, TutorialModuleId } from '../models/tutorial.models';
import { F01_TOURS } from '../tours/f01-security.tour';
import { F02_TOURS } from '../tours/f02-masters.tour';
import { F03_TOURS } from '../tours/f03-inventory.tour';
import { F04_TOURS } from '../tours/f04-purchases.tour';
import { F05_TOURS } from '../tours/f05-counter-sales.tour';
import { F06_TOURS } from '../tours/f06-receivables.tour';
import { F07_TOURS } from '../tours/f07-audit.tour';
import { F08_TOURS } from '../tours/f08-reports.tour';
import { F09_TOURS } from '../tours/f09-administration.tour';
import { SHELL_TOURS } from '../tours/shell.tour';

export const ALL_TUTORIALS: readonly TutorialDefinition[] = [
  ...SHELL_TOURS, ...F01_TOURS, ...F02_TOURS, ...F03_TOURS, ...F04_TOURS,
  ...F05_TOURS, ...F06_TOURS, ...F07_TOURS, ...F08_TOURS, ...F09_TOURS,
];

export const TUTORIAL_MODULE_ORDER: readonly TutorialModuleId[] = [
  'shell', 'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09',
];

@Injectable({ providedIn: 'root' })
export class TutorialRegistry {
  private readonly permissions = inject(PermissionService);
  readonly available = computed(() =>
    ALL_TUTORIALS.filter((tutorial) => this.canAccess(tutorial)).map((tutorial) => ({
      ...tutorial,
      steps: tutorial.steps.filter(
        (step) => !step.requiredPermission || this.permissions.has(step.requiredPermission),
      ),
    })),
  );

  find(id: string): TutorialDefinition | undefined {
    return this.available().find((tutorial) => tutorial.id === id);
  }

  private canAccess(tutorial: TutorialDefinition): boolean {
    const required = tutorial.requiredPermissions ?? [];
    return required.length === 0 || required.some((permission) => this.permissions.has(permission));
  }
}

