import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthService } from '../api/generated/services/auth.service';
import { AuthResponse, LoginRequest, RefreshRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiAdapter {
  private readonly api = inject(AuthService);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api
      .apiV1AuthLoginPost({ body: request })
      .pipe(map((response) => response.data ?? {}));
  }

  refresh(request: RefreshRequest): Observable<AuthResponse> {
    return this.api
      .apiV1AuthRefreshPost({ body: request })
      .pipe(map((response) => response.data ?? {}));
  }

  logout(request: RefreshRequest): Observable<object> {
    return this.api.apiV1AuthLogoutPost({ body: request });
  }
}
