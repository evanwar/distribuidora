import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-date-time',
  imports: [DatePipe],
  template: `<time [attr.datetime]="value()">{{ value() | date: format() }}</time>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiDateTimeComponent {
  readonly value = input.required<string | Date>();
  readonly format = input('medium');
}
