import { inject, Injectable } from '@angular/core';
import { SessionService } from '../auth/session.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly session = inject(SessionService);

  has(permission?: string): boolean {
    return !permission || this.session.hasPermission(permission);
  }
}
