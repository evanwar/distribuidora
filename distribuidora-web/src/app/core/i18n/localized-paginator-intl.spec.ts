import { TestBed } from '@angular/core/testing';
import { LANGUAGE_RELOAD, LanguageService } from './language.service';
import { LocalizedPaginatorIntl } from './localized-paginator-intl';

describe('LocalizedPaginatorIntl', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        LocalizedPaginatorIntl,
        { provide: LANGUAGE_RELOAD, useValue: () => undefined },
      ],
    });
  });

  it('localizes labels and ranges', () => {
    const paginator = TestBed.inject(LocalizedPaginatorIntl);
    expect(paginator.itemsPerPageLabel).toBe('Elementos por página:');
    expect(paginator.nextPageLabel).toBe('Página siguiente');
    expect(paginator.getRangeLabel(0, 25, 40)).toBe('1–25 de 40');
    expect(paginator.getRangeLabel(1, 25, 40)).toBe('26–40 de 40');
  });
});
