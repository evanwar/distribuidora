import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AppLanguage, LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonModule, MatMenuModule],
  template: `
    <button
      matButton
      type="button"
      [matMenuTriggerFor]="languageMenu"
      [attr.aria-label]="i18n.translate('app.language')"
    >
      {{ i18n.language().toUpperCase() }}
    </button>
    <mat-menu #languageMenu="matMenu">
      <button mat-menu-item type="button" [disabled]="i18n.language() === 'es'" (click)="select('es')">
        Español
      </button>
      <button mat-menu-item type="button" [disabled]="i18n.language() === 'en'" (click)="select('en')">
        English
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(LanguageService);

  protected select(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }
}
