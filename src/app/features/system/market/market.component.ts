import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '../../../shared/components/crud/base-crud.component';
import { CrudComponent } from '../../../shared/components/crud/crud.component';
import { MarketService } from './market.service';
import { TicketExchangeResponse } from '../../../shared/models/ticket-exchange.model';
import { Observable } from 'rxjs';

interface MarketQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  keyword?: string;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class MarketComponent extends BaseCrudComponent<TicketExchangeResponse, MarketQuery, any> {
  private marketService = inject(MarketService);

  // Expose the API to BaseCrudComponent
  getService() {
    return {
      query: (query: MarketQuery, page: number, size: number): Observable<any> => {
        // BaseCrudComponent has page 0-indexed, but getExchanges in API is 1-indexed.
        // Wait, BaseCrudComponent sends page (0-indexed). So we need page + 1
        // Let's pass page + 1 to service
        return this.marketService.getExchanges(page + 1, size, query.startDate, query.endDate, query.status, query.keyword);
      }
    };
  }

  getDefaultForm(): any {
    return {};
  }

  override getDefaultQuery(): MarketQuery {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(today.setDate(diff + 6));
    
    const formatDate = (date: Date) => {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    return {
      startDate: formatDate(monday),
      endDate: formatDate(sunday),
      status: '',
      keyword: ''
    };
  }

  onDeleteRow(item: TicketExchangeResponse) {
    this.confirmService.confirm(`Bạn có chắc muốn hủy vé của ${item.sellerName}?`, 'Xác nhận hủy').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.marketService.forceCancelTicket(item.exchangeId).subscribe({
          next: () => {
            this.toastService.showSuccess('Ép hủy vé thành công!');
            this.loadData();
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
          }
        });
      }
    });
  }
}
