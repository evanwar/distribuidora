import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { CustomerRequest, CustomerVm, toCustomerVm } from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class CustomersApiAdapter {
  private readonly api = inject(ApiClientService);

  list(): Observable<readonly CustomerVm[]> {
    return this.api
      .get<unknown>('/api/v1/customers')
      .pipe(map((response) => (Array.isArray(response) ? response.map(toCustomerVm) : [])));
  }

  create(request: CustomerRequest): Observable<CustomerVm> {
    return this.api
      .post<unknown, CustomerRequest>('/api/v1/customers', request)
      .pipe(map(toCustomerVm));
  }

  update(id: string, request: CustomerRequest): Observable<CustomerVm> {
    return this.api
      .put<unknown, CustomerRequest>(`/api/v1/customers/${encodeURIComponent(id)}`, request)
      .pipe(map(toCustomerVm));
  }
}
