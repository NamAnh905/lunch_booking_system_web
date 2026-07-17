import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'moneyShort',
  standalone: true,
})
export class MoneyShortPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return '0k';
    }
    return `${Number(value) / 1000}k`;
  }
}
