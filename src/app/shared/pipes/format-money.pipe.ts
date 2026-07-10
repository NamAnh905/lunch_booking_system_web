import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatMoney',
  standalone: true
})
export class FormatMoneyPipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '0 VNĐ';
    }
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) {
      return '0 VNĐ';
    }
    // Formats e.g. 25000 -> 25,000
    const formatted = num.toLocaleString('en-US');
    return `${formatted} VNĐ`;
  }
}
