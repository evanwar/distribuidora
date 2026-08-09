# Internationalization

The application supports Spanish (`es-MX`) and English (`en-US`). Spanish is the default and fallback language.

## Frontend

- `LanguageService` owns the active language and persists it in `distribuidora.language.v1`.
- `translation.catalog.ts` is the single source of UI translations. Its `TranslationKey` type and the English `Record` make missing English keys a compile-time error.
- Changing language reloads the SPA intentionally so Angular pipes, Material components, dates, numbers and currency all start with the selected `LOCALE_ID`.
- `languageInterceptor` sends the locale as `Accept-Language` on every HTTP request.
- Interpolated messages use named parameters: `translate('key', { name: value })`.

Every new user-facing string must be added to both catalogs and consumed through `LanguageService.translate`. Do not use language conditionals in feature templates.

## API

- ASP.NET Core request localization supports `es-MX` and `en-US`.
- Requests without a supported language use `es-MX`.
- Shared API messages live in `Localization/ApiMessages*.resx`.
- Responses include `Content-Language` and use the request culture for localized authentication, authorization, validation and unexpected-error messages.

Domain codes, identifiers, persisted values and audit data are never translated. Only user-facing presentation messages are localized.
