import { SpanishPaginatorIntl } from './spanish-paginator-intl';

describe('SpanishPaginatorIntl', () => {
  it('localizes labels and ranges', () => {
    const paginator = new SpanishPaginatorIntl();
    expect(paginator.itemsPerPageLabel).toBe('Elementos por página:');
    expect(paginator.nextPageLabel).toBe('Página siguiente');
    expect(paginator.getRangeLabel(0, 25, 40)).toBe('1–25 de 40');
    expect(paginator.getRangeLabel(1, 25, 40)).toBe('26–40 de 40');
  });
});
