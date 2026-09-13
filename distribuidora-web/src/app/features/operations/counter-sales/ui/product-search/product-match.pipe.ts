import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'productMatch' })
export class ProductMatchPipe implements PipeTransform {
  transform(text: string, query: string): { text: string; match: boolean }[] {
    const terms = query.trim().split(/\s+/).filter(Boolean).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!terms.length) return [{ text, match: false }];
    const expression = new RegExp(`(${terms.join('|')})`, 'gi');
    return text.split(expression).filter(Boolean).map(part => ({ text: part,
      match: terms.some(term => new RegExp(`^${term}$`, 'i').test(part)) }));
  }
}
