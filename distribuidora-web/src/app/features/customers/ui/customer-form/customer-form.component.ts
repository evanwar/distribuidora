import { ChangeDetectionStrategy, Component, inject, input, OnChanges, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiActionBarComponent } from '../../../../shared/ui/action-bar/ui-action-bar.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { CustomerRequest, CustomerVm } from '../../models/customer.models';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-customer-form',
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    UiActionBarComponent,
    UiButtonComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Nombre') }}</mat-label>
          <input matInput formControlName="name" />
          <mat-error>{{ text('El nombre es obligatorio.') }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>RFC</mat-label>
          <input matInput formControlName="taxId" maxlength="13" />
          @if (form.controls.taxId.hasError('pattern')) {
            <mat-error>{{ language.language() === 'en' ? 'Enter a valid tax ID.' : 'Captura un RFC válido.' }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Nombre o razón social fiscal') }}</mat-label>
          <input matInput formControlName="fiscalLegalName" maxlength="254" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Código postal fiscal') }}</mat-label>
          <input matInput formControlName="fiscalZipCode" inputmode="numeric" maxlength="5" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Régimen fiscal') }}</mat-label>
          <input matInput formControlName="taxRegimeCode" inputmode="numeric" maxlength="3" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Uso CFDI predeterminado') }}</mat-label>
          <input matInput formControlName="defaultCfdiUseCode" maxlength="4" [placeholder]="text('Ej. G03')" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Correo de facturación') }}</mat-label>
          <input matInput formControlName="invoiceEmail" type="email" />
          @if (form.controls.invoiceEmail.hasError('email')) {
            <mat-error>{{ text('Captura un correo válido.') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Teléfono') }}</mat-label>
          <input matInput formControlName="phone" inputmode="tel" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Correo') }}</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>{{ text('Captura un correo válido.') }}</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Dirección') }}</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Ciudad') }}</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ text('Límite de crédito') }}</mat-label>
          <input matInput formControlName="creditLimit" type="number" min="0" />
        </mat-form-field>
        <div class="checks">
          <mat-checkbox formControlName="creditBlocked">{{ text('Crédito bloqueado') }}</mat-checkbox>
          <mat-checkbox formControlName="active">{{ text('Cliente activo') }}</mat-checkbox>
        </div>
      </div>
      <app-ui-action-bar [sticky]="true">
        <app-ui-button [label]="text('Cancelar')" variant="text" tone="neutral" (pressed)="cancelled.emit()" />
        <app-ui-button
          [label]="text(customer() ? 'Guardar cambios' : 'Crear cliente')"
          type="submit"
          [loading]="saving()"
          [disabled]="form.invalid"
        />
      </app-ui-action-bar>
    </form>
  `,
  styles: `
    form { display: grid; gap: var(--space-4); }
    .checks { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-2); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent implements OnChanges {
  protected readonly language = inject(LanguageService);
  readonly customer = input<CustomerVm | null>(null);
  readonly saving = input(false);
  readonly saved = output<CustomerRequest>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i)],
    }),
    fiscalLegalName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(254)] }),
    fiscalZipCode: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^$|^\d{5}$/)] }),
    taxRegimeCode: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^$|^\d{3}$/)] }),
    defaultCfdiUseCode: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^$|^[A-Z0-9]{3,4}$/i)] }),
    invoiceEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    address: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    creditLimit: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    creditBlocked: new FormControl(false, { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
  });

  ngOnChanges(): void {
    const customer = this.customer();
    this.form.reset(
      customer ?? {
        name: '',
        taxId: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        creditLimit: 0,
        creditBlocked: false,
        active: true,
        fiscalLegalName: '',
        fiscalZipCode: '',
        taxRegimeCode: '',
        defaultCfdiUseCode: '',
        invoiceEmail: '',
      },
    );
  }

  protected text(value: string): string {
    return this.language.text(value);
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
