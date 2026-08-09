import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/error-handling/api-error.model';
import { SessionService } from '../../../../core/auth/session.service';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { LanguageService } from '../../../../core/i18n/language.service';
import { LanguageSwitcherComponent } from '../../../../shared/ui/language-switcher/language-switcher.component';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    UiAlertComponent,
    UiButtonComponent,
    LanguageSwitcherComponent,
  ],
  template: `
    <main>
      <div class="language-action"><app-language-switcher /></div>
      <section class="login-intro">
        <span class="login-intro__mark" aria-hidden="true">D</span>
        <p class="eyebrow">Distribuidora</p>
        <h1>{{ i18n.translate('login.welcome') }}</h1>
        <p>{{ i18n.translate('login.intro') }}</p>
      </section>

      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>{{ i18n.translate('login.title') }}</mat-card-title>
          <mat-card-subtitle>{{ i18n.translate('login.subtitle') }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (error()) {
            <app-ui-alert
              [title]="i18n.translate('login.error')"
              [message]="error()!.message"
              tone="danger"
              [correlationId]="error()!.correlationId"
              [operationId]="error()!.operationId"
            />
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.translate('login.username') }}</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              @if (form.controls.username.hasError('required')) {
                <mat-error>{{ i18n.translate('login.usernameRequired') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ i18n.translate('login.password') }}</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
              @if (form.controls.password.hasError('required')) {
                <mat-error>{{ i18n.translate('login.passwordRequired') }}</mat-error>
              }
            </mat-form-field>

            <div class="remember-account">
              <mat-checkbox formControlName="rememberAccount">
                {{ i18n.translate('login.remember') }}
              </mat-checkbox>
              <span>{{ i18n.translate('login.accountHint') }}</span>
            </div>

            <app-ui-button
              [label]="i18n.translate('login.signIn')"
              [loadingLabel]="i18n.translate('login.signingIn')"
              type="submit"
              [loading]="loading()"
              [disabled]="form.invalid"
              [fullWidth]="true"
            />
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      background:
        radial-gradient(
          circle at 10% 10%,
          color-mix(in srgb, var(--mat-sys-primary) 18%, transparent),
          transparent 35%
        ),
        var(--app-bg);
    }

    main {
      display: grid;
      align-items: center;
      gap: var(--space-6);
      width: min(100% - 2rem, 64rem);
      min-height: 100dvh;
      margin-inline: auto;
      padding-block: var(--space-6);
    }

    .language-action {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
    }

    .login-intro {
      max-width: 34rem;
    }

    .login-intro__mark {
      display: grid;
      width: 3.5rem;
      height: 3.5rem;
      place-items: center;
      border-radius: var(--app-radius-md);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font-size: 1.5rem;
      font-weight: 850;
    }

    .eyebrow {
      margin: var(--space-5) 0 var(--space-2);
      color: var(--app-info);
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(2.6rem, 10vw, 4.75rem);
      line-height: 0.95;
      letter-spacing: -0.055em;
    }

    .login-intro p:last-child {
      color: var(--app-text-muted);
      font-size: 1.1rem;
    }

    mat-card {
      width: 100%;
      border-radius: var(--app-radius-lg);
      background: color-mix(in srgb, var(--app-surface) 94%, transparent);
      box-shadow: var(--app-shadow);
    }

    mat-card-content,
    form {
      display: grid;
      gap: var(--space-4);
    }

    mat-card-content {
      padding-top: var(--space-5);
    }

    .remember-account {
      display: grid;
      gap: var(--space-1);
      margin-top: calc(var(--space-2) * -1);
    }

    .remember-account span {
      padding-inline-start: 2.5rem;
      color: var(--app-text-muted);
      font-size: 0.82rem;
    }

    @media (min-width: 48rem) {
      main {
        grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 0.75fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(LanguageService);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = new FormGroup({
    username: new FormControl(this.session.rememberedUsername(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberAccount: new FormControl(Boolean(this.session.rememberedUsername()), {
      nonNullable: true,
    }),
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { username, password, rememberAccount } = this.form.getRawValue();
    this.session
      .login({ username, password }, rememberAccount)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: ApiError) => this.error.set(error),
      });
  }
}
