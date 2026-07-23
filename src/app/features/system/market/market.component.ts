import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '../../../shared/components/crud/base-crud.component';
import { CrudComponent } from '../../../shared/components/crud/crud.component';
import { CrudSearchComponent } from '../../../shared/components/crud/crud-search.component';
import { MarketService } from './market.service';
import { TicketExchangeResponse } from '../../../shared/models/ticket-exchange.model';
import { toIsoDate } from '@shared/utils/date.util';
import { Observable } from 'rxjs';

interface MarketQuery {
  date?: string;
  status?: string;
  keyword?: string;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CrudComponent,
    CrudSearchComponent
  ],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class MarketComponent extends BaseCrudComponent<TicketExchangeResponse, MarketQuery, any> {
  private marketService = inject(MarketService);

  getService() {
    return {
      query: (query: MarketQuery, page: number, size: number): Observable<any> => {
        // BaseCrudComponent has page 0-indexed, but getExchanges in API is 1-indexed.
        return this.marketService.getExchanges(page + 1, size, query.date, query.date, query.status, query.keyword);
      }
    };
  }

  getDefaultForm(): any {
    return {};
  }

  override getDefaultQuery(): MarketQuery {
    return {
      date: toIsoDate(new Date()),
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
