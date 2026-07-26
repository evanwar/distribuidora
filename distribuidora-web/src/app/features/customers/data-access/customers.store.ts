import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiError } from '../../../core/error-handling/api-error.model';
import { CustomerRequest, CustomerVm } from '../models/customer.models';
import { CustomersApiAdapter } from './customers-api.adapter';

@Injectable()
export class CustomersStore {
  private readonly api = inject(CustomersApiAdapter);
  private readonly customersState = signal<readonly CustomerVm[]>([]);
  private readonly queryState = signal('');
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);

  readonly query = this.queryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly customers = computed(() => {
    const query = this.queryState().trim().toLocaleLowerCase('es-MX');
    if (!query) return this.customersState();
    return this.customersState().filter((customer) =>
      [customer.name, customer.taxId, customer.phone, customer.email].some((value) =>
        value.toLocaleLowerCase('es-MX').includes(query),
      ),
    );
  });

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .list()
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (customers) => this.customersState.set(customers),
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  search(query: string): void {
    this.queryState.set(query);
  }

  save(id: string | undefined, request: CustomerRequest, completed: () => void): void {
    this.savingState.set(true);
    this.errorState.set(null);
    const operation = id ? this.api.update(id, request) : this.api.create(request);
    operation.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: () => {
        completed();
        this.load();
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }
}
