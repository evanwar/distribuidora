import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { UiButtonComponent } from '../button/ui-button.component';

@Component({
  selector: 'app-trace-reference',
  imports: [UiButtonComponent],
  template: `
    <div class="trace-reference">
      <div class="trace-reference__ids">
        <span>Referencia de soporte</span>
        <code>{{ correlationId() }}</code>
        @if (operationId()) {
          <small
            >Operación: <code>{{ operationId() }}</code></small
          >
        }
      </div>
      <div class="trace-reference__actions">
        <app-ui-button
          [label]="copied() ? 'Copiada' : 'Copiar referencia'"
          variant="text"
          size="compact"
          (pressed)="copy()"
        />
        @if (canOpenTrace()) {
          <app-ui-button
            label="Ver trazabilidad"
            variant="text"
            size="compact"
            (pressed)="openTrace.emit()"
          />
        }
      </div>
    </div>
    <span class="sr-only" aria-live="polite">{{ announcement() }}</span>
  `,
  styles: `
    .trace-reference {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-4);
      margin-top: var(--space-2);
      color: var(--app-text-muted);
    }

    .trace-reference__ids {
      display: grid;
      min-width: 0;
      gap: var(--space-1);
      font-size: 0.78rem;
    }

    code {
      overflow-wrap: anywhere;
      color: var(--app-text);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.78rem;
    }

    small {
      font-size: inherit;
    }

    .trace-reference__actions {
      display: flex;
      flex-wrap: wrap;
      margin-inline-start: auto;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceReferenceComponent {
  readonly correlationId = input.required<string>();
  readonly operationId = input<string>();
  readonly canOpenTrace = input(false);
  readonly openTrace = output<void>();
  readonly copied = signal(false);
  readonly announcement = signal('');

  async copy(): Promise<void> {
    const reference = this.operationId()
      ? `Correlation ID: ${this.correlationId()}\nOperation ID: ${this.operationId()}`
      : `Correlation ID: ${this.correlationId()}`;
    try {
      await navigator.clipboard.writeText(reference);
      this.copied.set(true);
      this.announcement.set('Referencia copiada al portapapeles.');
    } catch {
      this.announcement.set('No fue posible copiar la referencia. Selecciónala manualmente.');
    }
  }
}
