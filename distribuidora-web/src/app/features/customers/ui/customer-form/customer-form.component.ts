import { ChangeDetectionStrategy, Component, input, OnChanges, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UiActionBarComponent } from '../../../../shared/ui/action-bar/ui-action-bar.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { CustomerRequest, CustomerVm } from '../../models/customer.models';

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
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          <mat-error>El nombre es obligatorio.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>RFC</mat-label>
          <input matInput formControlName="taxId" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" inputmode="tel" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Correo</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>Captura un correo válido.</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ciudad</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Límite de crédito</mat-label>
          <input matInput formControlName="creditLimit" type="number" min="0" />
        </mat-form-field>
        <div class="checks">
          <mat-checkbox formControlName="creditBlocked">Crédito bloqueado</mat-checkbox>
          <mat-checkbox formControlName="active">Cliente activo</mat-checkbox>
        </div>
      </div>
      <app-ui-action-bar [sticky]="true">
        <app-ui-button label="Cancelar" variant="text" tone="neutral" (pressed)="cancelled.emit()" />
        <app-ui-button
          [label]="customer() ? 'Guardar cambios' : 'Crear cliente'"
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
  readonly customer = input<CustomerVm | null>(null);
  readonly saving = input(false);
  readonly saved = output<CustomerRequest>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    taxId: new FormControl('', { nonNullable: true }),
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
      },
    );
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
