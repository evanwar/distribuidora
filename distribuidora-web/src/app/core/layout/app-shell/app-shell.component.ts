import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { UiIconComponent, UiIconName } from '../../../shared/ui/icon/ui-icon.component';
import { SessionService } from '../../auth/session.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslationKey } from '../../i18n/translation.catalog';
import { LanguageSwitcherComponent } from '../../../shared/ui/language-switcher/language-switcher.component';
import { TutorialLauncherComponent } from '../../tutorials/ui/tutorial-launcher.component';
import { TutorialOrchestratorService } from '../../tutorials/services/tutorial-orchestrator.service';

interface NavigationItem {
  label: TranslationKey;
  path: string;
  icon: UiIconName;
}

interface NavigationGroup {
  label: TranslationKey;
  items: readonly NavigationItem[];
}

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    LanguageSwitcherComponent,
    TutorialLauncherComponent,
    UiIconComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  template: `
    <mat-sidenav-container>
      <mat-sidenav
        #sidenav
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        [fixedInViewport]="isHandset()"
        [attr.aria-label]="i18n.translate('app.navigation')"
      >
        <a class="brand" routerLink="/dashboard" (click)="closeOnHandset(sidenav)">
          <span class="brand__mark" aria-hidden="true">D</span>
          <span>
            <strong>Distribuidora</strong>
            <small>{{ i18n.translate('app.brandSubtitle') }}</small>
          </span>
        </a>

        <nav data-tour="shell-navigation" [attr.aria-label]="i18n.translate('app.sections')">
          @for (group of navigation; track group.label) {
            <section>
              <h2>{{ i18n.translate(group.label) }}</h2>
              @for (item of group.items; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="nav-link--active"
                  [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
                  ariaCurrentWhenActive="page"
                  class="nav-link"
                  (click)="closeOnHandset(sidenav)"
                >
                  <span class="nav-link__icon">
                    <app-ui-icon [name]="item.icon" />
                  </span>
                  <span>{{ i18n.translate(item.label) }}</span>
                </a>
              }
            </section>
          }
        </nav>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar>
          @if (isHandset()) {
            <button
              matIconButton
              type="button"
              [attr.aria-label]="i18n.translate('app.openNavigation')"
              [matTooltip]="i18n.translate('app.menu')"
              (click)="sidenav.open()"
            >
              <app-ui-icon name="menu" />
            </button>
          }
          <span class="toolbar-spacer"></span>
          <app-tutorial-launcher />
          <app-language-switcher data-tour="shell-language" />
          <span class="identity" data-tour="shell-user">{{ nameUpper }}</span>
          <button data-tour="shell-logout" matButton type="button" (click)="logout()">{{ i18n.translate('app.logout') }}</button>
        </mat-toolbar>

        <main id="main-content" data-tour="page-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host,
    mat-sidenav-container {
      display: block;
      min-height: 100dvh;
    }

    mat-sidenav {
      width: min(19rem, 88vw);
      border-inline-end: 1px solid color-mix(in srgb, var(--app-text) 8%, transparent);
      background: var(--app-surface);
      box-shadow: var(--app-shadow-navigation);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: 5rem;
      padding: var(--space-4);
      text-decoration: none;
    }

    .brand__mark {
      display: grid;
      width: 2.75rem;
      height: 2.75rem;
      place-items: center;
      border-radius: var(--app-radius-brand);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-size: 1.25rem;
      font-weight: 800;
    }

    .brand strong,
    .brand small {
      display: block;
    }

    .brand small {
      margin-top: 0.1rem;
      color: var(--app-text-muted);
    }

    nav {
      display: grid;
      gap: 1.35rem;
      padding: var(--space-1) var(--space-3) var(--space-5);
    }

    nav h2 {
      margin: 0 var(--space-3) 0.4rem;
      color: var(--app-text-muted);
      font-size: 0.68rem;
      font-weight: 750;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 3rem;
      padding: 0.35rem 0.55rem;
      border-radius: var(--app-radius-sm);
      color: var(--app-text-muted);
      text-decoration: none;
      font-weight: 590;
      transition:
        color 140ms ease,
        background-color 140ms ease,
        box-shadow 140ms ease;
    }

    .nav-link__icon {
      display: grid;
      width: 2.1rem;
      height: 2.1rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: var(--app-radius-control);
      color: color-mix(in srgb, var(--app-text-muted) 88%, var(--app-primary));
      transition:
        color 140ms ease,
        background-color 140ms ease,
        transform 140ms ease;
    }

    .nav-link:hover {
      background: color-mix(in srgb, var(--app-surface-muted) 72%, transparent);
      color: var(--app-text);
    }

    .nav-link:hover .nav-link__icon {
      color: var(--app-primary);
      transform: translateY(-1px);
    }

    .nav-link--active {
      background: color-mix(in srgb, var(--app-primary) 9%, var(--app-surface));
      color: var(--app-text);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-primary) 8%, transparent);
      font-weight: 680;
    }

    .nav-link--active .nav-link__icon {
      background: color-mix(in srgb, var(--app-primary) 12%, var(--app-surface));
      color: var(--app-primary-strong);
    }

    .nav-link:focus-visible,
    .brand:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--app-primary) 38%, transparent);
      outline-offset: 2px;
    }

    mat-toolbar {
      position: sticky;
      z-index: 5;
      top: 0;
      border-bottom: 1px solid color-mix(in srgb, var(--app-text) 8%, transparent);
      background: color-mix(in srgb, var(--app-surface) 92%, transparent);
      backdrop-filter: blur(16px);
    }

    .toolbar-spacer {
      flex: 1;
    }

    .identity {
      max-width: 12rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }

    main {
      min-height: calc(100dvh - 4rem);
      padding: var(--space-4);
    }

    @media (min-width: 60rem) {
      main {
        padding: var(--space-6);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly tutorials = inject(TutorialOrchestratorService);
  protected readonly session = inject(SessionService);
  protected readonly i18n = inject(LanguageService);


  protected readonly isHandset = toSignal(
    this.breakpoint.observe('(max-width: 959px)').pipe(map((state) => state.matches)),
    { initialValue: true },
  );


  public nameUpper = this.session.identity()?.name.toLocaleUpperCase(this.i18n.locale()) ?? this.i18n.translate('login.username');

  protected readonly navigation: readonly NavigationGroup[] = [
    {
      label: 'nav.operation',
      items: [
        { label: 'nav.home', path: '/dashboard', icon: 'home' },
        { label: 'nav.pointOfSale', path: '/operations/counter-sales', icon: 'point-of-sale' },
        { label: 'nav.inventory', path: '/operations/inventory', icon: 'inventory' },
        { label: 'nav.purchases', path: '/operations/purchases', icon: 'purchases' },
        { label: 'nav.collection', path: '/operations/receivables', icon: 'receivables' },
      ],
    },
    {
      label: 'nav.catalogs',
      items: [
        { label: 'nav.customers', path: '/customers', icon: 'customers' },
        { label: 'nav.suppliers', path: '/suppliers', icon: 'suppliers' },
        { label: 'nav.products', path: '/products', icon: 'products' },
        { label: 'nav.otherCatalogs', path: '/masters', icon: 'masters' },
      ],
    },
    {
      label: 'nav.control',
      items: [
        { label: 'nav.usersAndRoles', path: '/operations/security', icon: 'security' },
        { label: 'nav.reports', path: '/operations/reports', icon: 'reports' },
        { label: 'nav.audit', path: '/operations/audit', icon: 'audit' },
        { label: 'nav.administration', path: '/operations/administration', icon: 'settings' },
        {
          label: 'nav.paymentTerminals',
          path: '/operations/administration/payment-terminals',
          icon: 'point-of-sale',
        },
      ],
    },
  ];

  protected closeOnHandset(sidenav: { close: () => Promise<unknown> }): void {
    if (this.isHandset()) void sidenav.close();
  }

  protected logout(): void {
    this.tutorials.destroy();
    this.session.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }


}
