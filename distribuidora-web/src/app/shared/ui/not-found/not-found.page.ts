import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule],
  template: `
    <main>
      <span>404</span>
      <h1>{{ text('Esta página no existe') }}</h1>
      <p>{{ text('Verifica la dirección o vuelve al inicio.') }}</p>
      <a matButton="filled" routerLink="/">{{ text('Volver al inicio') }}</a>
    </main>
  `,
  styles: `
    main {
      display: grid;
      place-items: center;
      align-content: center;
      min-height: 100dvh;
      padding: var(--space-5);
      text-align: center;
    }
    span { color: var(--app-info); font-weight: 800; }
    h1 { margin-bottom: 0; }
    p { color: var(--app-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  private readonly language = inject(LanguageService);
  protected text(value: string): string { return this.language.text(value); }
}
