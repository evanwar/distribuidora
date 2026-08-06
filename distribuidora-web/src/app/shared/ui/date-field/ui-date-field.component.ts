import { ChangeDetectionStrategy, Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export const UI_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DDDD, D [de] MMMM [de] YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export class UiDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;
    const displayMatch = DISPLAY_DATE_PATTERN.exec(trimmed);
    if (displayMatch) {
      return this.createValidDate(+displayMatch[3], +displayMatch[2], +displayMatch[1]);
    }
    return parseIsoDate(trimmed);
  }

  override format(date: Date): string {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  private createValidDate(year: number, month: number, day: number): Date | null {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }
}

@Component({
  selector: 'app-ui-date-field',
  imports: [ReactiveFormsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: [
    { provide: DateAdapter, useClass: UiDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: UI_DATE_FORMATS },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDateFieldComponent), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>{{ label }}</mat-label>
      <input
        matInput
        [formControl]="dateControl"
        [matDatepicker]="picker"
        [min]="minDate"
        [max]="maxDate"
        [required]="required"
        [placeholder]="placeholder"
        autocomplete="off"
        (blur)="markTouched()"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker" [attr.aria-label]="'Abrir calendario para ' + label" />
      <mat-datepicker #picker [startView]="startView" (closed)="markTouched()" />
      @if (hint && !dateControl.hasError('matDatepickerParse')) {
        <mat-hint>{{ hint }}</mat-hint>
      }
      @if (dateControl.hasError('matDatepickerParse')) {
        <mat-error>Escribe una fecha válida en formato DD/MM/AAAA.</mat-error>
      } @else if (dateControl.hasError('matDatepickerMin')) {
        <mat-error>La fecha es anterior al mínimo permitido.</mat-error>
      } @else if (dateControl.hasError('matDatepickerMax')) {
        <mat-error>La fecha es posterior al máximo permitido.</mat-error>
      }
    </mat-form-field>
  `,
  styles: `
    :host,
    mat-form-field { display: block; width: 100%; min-width: 0; }
  `,
})
export class UiDateFieldComponent implements ControlValueAccessor {
  @Input({ required: true }) label = '';
  @Input() hint = '';
  @Input() placeholder = 'DD/MM/AAAA';
  @Input() required = false;
  @Input() startView: 'month' | 'year' | 'multi-year' = 'month';
  @Output() readonly valueChange = new EventEmitter<string>();

  readonly dateControl = new FormControl<Date | null>(null);
  minDate: Date | null = null;
  maxDate: Date | null = null;

  @Input() set value(value: string | null | undefined) {
    this.writeValue(value ?? '');
  }

  @Input() set min(value: string | null | undefined) {
    this.minDate = parseIsoDate(value ?? '');
  }

  @Input() set max(value: string | null | undefined) {
    this.maxDate = parseIsoDate(value ?? '');
  }

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.dateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((date) => {
      const value = formatIsoDate(date);
      this.onChange(value);
      this.valueChange.emit(value);
    });
  }

  writeValue(value: string | null): void {
    this.dateControl.setValue(parseIsoDate(value ?? ''), { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) this.dateControl.disable({ emitEvent: false });
    else this.dateControl.enable({ emitEvent: false });
  }

  markTouched(): void {
    this.onTouched();
  }
}

function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = +match[1];
  const month = +match[2];
  const day = +match[3];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function formatIsoDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
