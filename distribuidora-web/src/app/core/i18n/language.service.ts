import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { englishTranslations, spanishTranslations, TranslationKey } from './translation.catalog';
import { translateUiText } from './ui-text.catalog';

export type AppLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'distribuidora.language.v1';
const DEFAULT_LANGUAGE: AppLanguage = 'es';
const APP_LOCALES: Record<AppLanguage, string> = { es: 'es-MX', en: 'en-US' };

export const LANGUAGE_RELOAD = new InjectionToken<() => void>('LANGUAGE_RELOAD', {
  factory: () => () => globalThis.location.reload(),
});

export function initialAppLanguage(): AppLanguage {
  try {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    return stored === 'en' || stored === 'es' ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function initialAppLocale(): string {
  return APP_LOCALES[initialAppLanguage()];
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly reload = inject(LANGUAGE_RELOAD);
  private readonly languageState = signal<AppLanguage>(initialAppLanguage());

  readonly language = this.languageState.asReadonly();
  readonly locale = computed(() => APP_LOCALES[this.languageState()]);

  constructor() {
    this.document.documentElement.lang = this.languageState();
  }

  translate(key: TranslationKey, parameters: Readonly<Record<string, string | number>> = {}): string {
    let message: string = this.languageState() === 'en' ? englishTranslations[key] : spanishTranslations[key];
    for (const [name, value] of Object.entries(parameters)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
    return message;
  }

  text(value: string): string {
    return translateUiText(value, this.languageState() === 'en');
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.languageState()) return;
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The preference remains valid for this session when storage is unavailable.
    }
    this.languageState.set(language);
    this.document.documentElement.lang = language;
    this.reload();
  }
}
