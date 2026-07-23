import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseCrudComponent } from '../../../../shared/components/crud/base-crud.component';
import { CrudComponent } from '../../../../shared/components/crud/crud.component';
import { CrudSearchComponent } from '../../../../shared/components/crud/crud-search.component';
import { TicketExchangeResponse } from '@shared/models';
import { TicketExchangeService } from '../ticket-exchange.service';

interface MarketQuery {
  keyword?: string;
}

@Component({
  selector: 'app-market-tickets-list',
  standalone: true,
  imports: [CommonModule, CrudComponent, CrudSearchComponent],
  templateUrl: './market-tickets-list.component.html',
  styleUrl: './market-tickets-list.component.scss',
})
export class MarketTicketsListComponent extends BaseCrudComponent<TicketExchangeResponse, MarketQuery, any> {
  private ticketExchangeService = inject(TicketExchangeService);

  @Input() currentUserId?: number;
  @Output() claim = new EventEmitter<TicketExchangeResponse>();

  readonly hiddenPermissions = {};

  getService() {
    return {
      query: (query: MarketQuery, page: number, size: number): Observable<any> => {
        return this.ticketExchangeService
          .getMarketTickets(page + 1, size, query.keyword)
          .pipe(
            map((res) => {
              const pageData = res.result;
              if (pageData?.data) {
                pageData.data = [...pageData.data].sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
              }
              return res;
            })
          );
      },
    };
  }

  getDefaultForm(): any {
    return {};
  }

  override getDefaultQuery(): MarketQuery {
    return { keyword: '' };
  }

  onClaim(ticket: TicketExchangeResponse): void {
    this.claim.emit(ticket);
  }
}
