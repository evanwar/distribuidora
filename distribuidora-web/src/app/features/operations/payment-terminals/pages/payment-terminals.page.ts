import { ChangeDetectionStrategy, Component, inject, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFeedbackComponent } from '../../../../shared/ui/feedback/ui-feedback.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiStatusChipComponent } from '../../../../shared/ui/status-chip/ui-status-chip.component';
import {
  PaymentTerminalsApiAdapter,
  PaymentTerminalViewModel,
} from '../data-access/payment-terminals-api.adapter';
import { PaymentTerminalsStore } from '../data-access/payment-terminals.store';
import { LanguageService } from '../../../../core/i18n/language.service';

const PAYMENT_TERMINAL_FORM_LIMITS = {
  nameMaximumLength: 120,
  externalIdMaximumLength: 150,
  descriptionMaximumLength: 500,
  descriptionRows: 3,
  initialRowVersion: 0,
} as const;

@Component({
  selector: 'app-payment-terminals-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    UiAlertComponent,
    UiButtonComponent,
    UiFeedbackComponent,
    UiPageHeaderComponent,
    UiStatusChipComponent,
  ],
  providers: [PaymentTerminalsApiAdapter, PaymentTerminalsStore],
  template: `
    <div class="page">
      <app-ui-page-header
        data-tour="page-header"
        [eyebrow]="i18n.translate('nav.administration')"
        [title]="i18n.translate('terminal.title')"
        [subtitle]="i18n.translate('terminal.subtitle')"
      >
        <app-ui-button data-tour="payment-terminals-action"
          [label]="i18n.translate('terminal.new')"
          icon="add"
          variant="outlined"
          permission="admin.manage_payment_terminals"
          (pressed)="startCreate()"
        />
      </app-ui-page-header>

      @if (store.error()) {
        <app-ui-alert
          [title]="i18n.translate('terminal.error')"
          [message]="store.error()!.message"
          tone="danger"
          [correlationId]="store.error()!.correlationId"
          [operationId]="store.error()!.operationId"
          [actionLabel]="i18n.translate('common.retry')"
          (action)="store.load()"
        />
      }
      @if (store.notice()) {
        <app-ui-alert [title]="i18n.translate('common.ready')" [message]="store.notice()!" tone="success" />
      }

      <section class="terminal-layout">
        <div data-tour="payment-terminals-list" class="surface terminal-list" aria-live="polite">
          <div class="section-heading">
            <div>
              <h2>{{ i18n.translate('terminal.registered') }}</h2>
              <p>{{ i18n.translate('terminal.defaultHelp') }}</p>
            </div>
            <app-ui-button
              [label]="i18n.translate('common.refresh')"
              icon="refresh"
              variant="text"
              [disabled]="store.loading()"
              (pressed)="store.load()"
            />
          </div>

          @if (store.loading()) {
            <app-ui-feedback
              kind="loading"
              [title]="i18n.translate('terminal.loading')"
              [message]="i18n.translate('terminal.loadingHelp')"
            />
          } @else if (store.terminals().length === 0) {
            <app-ui-feedback
              kind="empty"
              icon="point-of-sale"
              [title]="i18n.translate('terminal.empty')"
              [message]="i18n.translate('terminal.emptyHelp')"
              [actionLabel]="i18n.translate('terminal.create')"
              (action)="startCreate()"
            />
          } @else {
            <div class="terminal-cards">
              @for (terminal of store.terminals(); track terminal.id) {
                <mat-card appearance="outlined" class="terminal-card">
                  <mat-card-header>
                    <mat-card-title>{{ terminal.name }}</mat-card-title>
                    <mat-card-subtitle>{{ terminal.externalId }}</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="chips">
                      <app-ui-status-chip
                        [label]="i18n.translate(terminal.active ? 'terminal.active' : 'terminal.inactive')"
                        [tone]="terminal.active ? 'success' : 'neutral'"
                        [icon]="terminal.active ? 'check' : 'close'"
                      />
                      @if (terminal.isDefault) {
                        <app-ui-status-chip [label]="i18n.translate('terminal.default')" tone="info" icon="point-of-sale" />
                      }
                    </div>
                    @if (terminal.description) {
                      <p>{{ terminal.description }}</p>
                    }
                  </mat-card-content>
                  <mat-card-actions align="end">
                    <app-ui-button
                      [label]="i18n.translate('terminal.edit')"
                      icon="edit"
                      variant="text"
                      permission="admin.manage_payment_terminals"
                      (pressed)="edit(terminal)"
                    />
                    @if (terminal.active) {
                      <app-ui-button
                        [label]="i18n.translate('terminal.deactivate')"
                        icon="close"
                        variant="text"
                        tone="danger"
                        permission="admin.manage_payment_terminals"
                        [disabled]="store.saving()"
                        (pressed)="requestDeactivate(terminal)"
                      />
                    } @else {
                      <app-ui-button
                        [label]="i18n.translate('terminal.reactivate')"
                        icon="refresh"
                        variant="text"
                        permission="admin.manage_payment_terminals"
                        [disabled]="store.saving()"
                        (pressed)="store.setActive(terminal, true)"
                      />
                    }
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          }
        </div>

      </section>
    </div>

    <ng-template #editorDialog>
      <form class="terminal-editor" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h2 mat-dialog-title>{{ i18n.translate(editingId() ? 'terminal.editTitle' : 'terminal.create') }}</h2>
        <mat-dialog-content>
          <p class="dialog-description">{{ i18n.translate('terminal.identifierHelp') }}</p>
          @if (store.error()) {
            <app-ui-alert
              [title]="i18n.translate('terminal.saveError')"
              [message]="store.error()!.message"
              tone="danger"
              [correlationId]="store.error()!.correlationId"
              [operationId]="store.error()!.operationId"
            />
          }
          <div class="terminal-editor__fields">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>{{ i18n.translate('terminal.name') }}</mat-label>
                <input
                  matInput
                  class="terminal-name-input"
                  formControlName="name"
                  [maxlength]="formLimits.nameMaximumLength"
                  autocomplete="off"
                />
                @if (form.controls.name.touched && form.controls.name.invalid) {
                  <mat-error>{{ i18n.translate('terminal.nameRequired') }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>{{ i18n.translate('terminal.externalId') }}</mat-label>
                <input
                  matInput
                  formControlName="externalId"
                  [maxlength]="formLimits.externalIdMaximumLength"
                  autocomplete="off"
                />
                <mat-hint>{{ i18n.translate('terminal.externalExample') }}</mat-hint>
                @if (form.controls.externalId.touched && form.controls.externalId.invalid) {
                  <mat-error>{{ i18n.translate('terminal.externalRequired') }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>{{ i18n.translate('terminal.description') }}</mat-label>
                <textarea
                  matInput
                  [rows]="formLimits.descriptionRows"
                  formControlName="description"
                  [maxlength]="formLimits.descriptionMaximumLength"
                ></textarea>
              </mat-form-field>

              <div class="check-options">
                <mat-checkbox formControlName="isDefault">{{ i18n.translate('terminal.useDefault') }}</mat-checkbox>
                <mat-checkbox formControlName="active">{{ i18n.translate('terminal.statusActive') }}</mat-checkbox>
              </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <app-ui-button
            [label]="i18n.translate('common.cancel')"
            variant="text"
            [disabled]="store.saving()"
            (pressed)="closeEditorDialog()"
          />
          <app-ui-button
            [label]="i18n.translate(editingId() ? 'terminal.save' : 'terminal.create')"
            [loadingLabel]="i18n.translate('terminal.saveBusy')"
            icon="check"
            type="submit"
            permission="admin.manage_payment_terminals"
            [loading]="store.saving()"
            [disabled]="form.invalid"
          />
        </mat-dialog-actions>
      </form>
    </ng-template>

    <ng-template #deactivateDialog>
      <h2 mat-dialog-title>{{ i18n.translate('terminal.deactivateTitle') }}</h2>
      <mat-dialog-content>
        <p>
          {{ i18n.translate('terminal.deactivateHelp', { name: pendingDeactivation()?.name ?? '' }) }}
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <app-ui-button [label]="i18n.translate('terminal.keepActive')" variant="text" (pressed)="closeDeactivateDialog()" />
        <app-ui-button
          [label]="i18n.translate('terminal.deactivate')"
          [loadingLabel]="i18n.translate('terminal.deactivateBusy')"
          tone="danger"
          [loading]="store.saving()"
          (pressed)="confirmDeactivate()"
        />
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--space-5);
    }

    .terminal-layout {
      display: grid;
      gap: var(--space-4);
      align-items: start;
    }

    .surface {
      min-width: 0;
    }

    .terminal-list {
      padding: var(--space-4);
    }

    .section-heading,
    .chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    h2,
    p {
      margin: 0;
    }

    .section-heading p,
    .terminal-card p {
      margin-top: var(--space-1);
      color: var(--app-text-muted);
    }

    .terminal-cards {
      display: grid;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    .terminal-card mat-card-content {
      display: grid;
      gap: var(--space-3);
      padding-top: var(--space-3);
    }

    .chips {
      justify-content: flex-start;
    }

    .terminal-editor__fields {
      display: grid;
      gap: var(--space-4);
    }

    .dialog-description {
      margin-bottom: var(--space-4);
      color: var(--app-text-muted);
    }

    .terminal-editor app-ui-alert {
      display: block;
      margin-bottom: var(--space-4);
    }

    mat-form-field {
      width: 100%;
    }

    .check-options {
      display: grid;
      gap: var(--space-2);
    }

    @media (max-width: 599px) {
      mat-dialog-actions {
        align-items: stretch;
        flex-direction: column-reverse;
      }

      mat-dialog-actions app-ui-button {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentTerminalsPage implements OnInit {
  @ViewChild('editorDialog') private editorDialog!: TemplateRef<unknown>;
  @ViewChild('deactivateDialog') private deactivateDialog!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private editorDialogRef: MatDialogRef<unknown> | null = null;
  private deactivateDialogRef: MatDialogRef<unknown> | null = null;
  protected readonly store = inject(PaymentTerminalsStore);
  protected readonly i18n = inject(LanguageService);
  protected readonly formLimits = PAYMENT_TERMINAL_FORM_LIMITS;
  protected readonly editingId = signal<string | null>(null);
  protected readonly pendingDeactivation = signal<PaymentTerminalViewModel | null>(null);
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(PAYMENT_TERMINAL_FORM_LIMITS.nameMaximumLength)],
    }),
    externalId: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(PAYMENT_TERMINAL_FORM_LIMITS.externalIdMaximumLength),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(PAYMENT_TERMINAL_FORM_LIMITS.descriptionMaximumLength)],
    }),
    isDefault: new FormControl(false, { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
    rowVersion: new FormControl<number>(PAYMENT_TERMINAL_FORM_LIMITS.initialRowVersion, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      externalId: '',
      description: '',
      isDefault: false,
      active: true,
      rowVersion: PAYMENT_TERMINAL_FORM_LIMITS.initialRowVersion,
    });
    this.openEditorDialog();
  }

  protected edit(terminal: PaymentTerminalViewModel): void {
    this.editingId.set(terminal.id);
    this.form.reset({
      name: terminal.name,
      externalId: terminal.externalId,
      description: terminal.description ?? '',
      isDefault: terminal.isDefault,
      active: terminal.active,
      rowVersion: terminal.rowVersion,
    });
    this.openEditorDialog();
  }

  protected save(): void {
    if (this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const editingId = this.editingId();
    this.store.save(
      editingId,
      {
        name: value.name.trim(),
        externalId: value.externalId.trim(),
        description: value.description.trim() || null,
        isDefault: value.isDefault,
        active: value.active,
        ...(editingId ? { rowVersion: value.rowVersion } : {}),
      },
      () => this.closeEditorDialog(true),
    );
  }

  protected closeEditorDialog(force = false): void {
    if (force || !this.store.saving()) this.editorDialogRef?.close();
  }

  protected requestDeactivate(terminal: PaymentTerminalViewModel): void {
    this.pendingDeactivation.set(terminal);
    this.deactivateDialogRef = this.dialog.open(this.deactivateDialog, {
      width: 'min(32rem, calc(100vw - 2rem))',
      maxWidth: '100vw',
      restoreFocus: true,
    });
    this.deactivateDialogRef.afterClosed().subscribe(() => {
      this.pendingDeactivation.set(null);
      this.deactivateDialogRef = null;
    });
  }

  protected closeDeactivateDialog(): void {
    if (!this.store.saving()) this.deactivateDialogRef?.close();
  }

  protected confirmDeactivate(): void {
    const terminal = this.pendingDeactivation();
    if (!terminal) return;
    this.store.setActive(terminal, false);
    this.deactivateDialogRef?.close();
  }

  private openEditorDialog(): void {
    if (this.editorDialogRef) return;
    this.editorDialogRef = this.dialog.open(this.editorDialog, {
      width: 'min(38rem, calc(100vw - 1rem))',
      maxWidth: '100vw',
      maxHeight: 'calc(100dvh - 1rem)',
      autoFocus: '.terminal-name-input',
      restoreFocus: true,
    });
    this.editorDialogRef.afterClosed().subscribe(() => {
      this.editingId.set(null);
      this.editorDialogRef = null;
    });
  }
}
