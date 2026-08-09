import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/error-handling/api-error.model';
import { OperationContextService } from '../../../../core/observability/operation-context.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import {
  PaymentTerminalsApiAdapter,
  PaymentTerminalViewModel,
  SavePaymentTerminal,
} from './payment-terminals-api.adapter';

@Injectable()
export class PaymentTerminalsStore {
  private readonly api = inject(PaymentTerminalsApiAdapter);
  private readonly operations = inject(OperationContextService);
  private readonly i18n = inject(LanguageService);
  private readonly operation = this.operations.restoreOrStart('ADM', 'payment-terminals');
  private readonly terminalsState = signal<readonly PaymentTerminalViewModel[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<ApiError | null>(null);
  private readonly noticeState = signal<string | null>(null);

  readonly terminals = this.terminalsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .getAll(this.operations.toHttpContext(this.operation))
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (terminals) => this.terminalsState.set(terminals),
        error: (error: ApiError) => this.errorState.set(error),
      });
  }

  save(
    id: string | null,
    request: SavePaymentTerminal,
    completed: (terminal: PaymentTerminalViewModel) => void,
  ): void {
    if (this.savingState()) return;
    this.savingState.set(true);
    this.errorState.set(null);
    const operation = id
      ? this.api.update(id, request, this.operations.toHttpContext(this.operation))
      : this.api.create(request, this.operations.toHttpContext(this.operation));
    operation.pipe(finalize(() => this.savingState.set(false))).subscribe({
      next: (terminal) => {
        this.noticeState.set(this.i18n.translate(id ? 'terminal.notice.updated' : 'terminal.notice.created'));
        completed(terminal);
        this.load();
      },
      error: (error: ApiError) => this.errorState.set(error),
    });
  }

  setActive(terminal: PaymentTerminalViewModel, active: boolean): void {
    if (this.savingState()) return;
    this.savingState.set(true);
    this.errorState.set(null);
    this.api
      .setActive(terminal.id, active, this.operations.toHttpContext(this.operation))
      .pipe(finalize(() => this.savingState.set(false)))
      .subscribe({
        next: () => {
          this.noticeState.set(
            this.i18n.translate(active ? 'terminal.notice.reactivated' : 'terminal.notice.deactivated'),
          );
          this.load();
        },
        error: (error: ApiError) => this.errorState.set(error),
      });
  }
}
