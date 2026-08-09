import { inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LanguageService } from './language.service';

@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(LanguageService);

  override itemsPerPageLabel = this.i18n.translate('paginator.itemsPerPage');
  override nextPageLabel = this.i18n.translate('paginator.next');
  override previousPageLabel = this.i18n.translate('paginator.previous');
  override firstPageLabel = this.i18n.translate('paginator.first');
  override lastPageLabel = this.i18n.translate('paginator.last');

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) return `0 ${this.i18n.translate('paginator.of')} ${length}`;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1}–${end} ${this.i18n.translate('paginator.of')} ${length}`;
  };
}
