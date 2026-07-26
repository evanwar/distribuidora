import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule],
  template: `
    <main>
      <span>404</span>
      <h1>Esta página no existe</h1>
      <p>Verifica la dirección o vuelve al inicio.</p>
      <a matButton="filled" routerLink="/">Volver al inicio</a>
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
export class NotFoundPage {}
