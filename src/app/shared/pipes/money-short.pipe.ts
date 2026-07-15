import { Pipe, PipeTransform } from '@angular/core';

/**
 * Rút gọn số tiền theo đơn vị nghìn: 40000 -> "40k", 25500 -> "25.5k".
 * Thay cho cách chia cứng `/ 1000` + hậu tố 'k' rải rác trong component.
 */
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
