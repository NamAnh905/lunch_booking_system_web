import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatMoney',
  standalone: true
})
export class FormatMoneyPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return value;
  }
}
