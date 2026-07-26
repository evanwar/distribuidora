import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEnvelope, ApiRequestOptions } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(path, { params: this.toParams(options?.query) })
      .pipe(map((response) => this.unwrap(response)));
  }

  post<TResponse, TBody = unknown>(path: string, body?: TBody): Observable<TResponse> {
    return this.http
      .post<ApiEnvelope<TResponse>>(path, body ?? {})
      .pipe(map((response) => this.unwrap(response)));
  }

  put<TResponse, TBody = unknown>(path: string, body: TBody): Observable<TResponse> {
    return this.http
      .put<ApiEnvelope<TResponse>>(path, body)
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiEnvelope<T> | null): T {
    if (response === null) {
      return undefined as T;
    }
    if (response.success === false) {
      throw new Error(response.message ?? response.errors?.join(', ') ?? 'La operación no se completó.');
    }

    return response.data as T;
  }

  private toParams(query?: Readonly<Record<string, string | number | boolean | null | undefined>>): HttpParams {
    let params = new HttpParams();
    if (!query) {
      return params;
    }

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}
