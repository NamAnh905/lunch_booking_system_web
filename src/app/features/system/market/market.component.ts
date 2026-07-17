import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { vi } from 'date-fns/locale';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseCrudComponent } from '../../../shared/components/crud/base-crud.component';
import { CrudComponent } from '../../../shared/components/crud/crud.component';
import { CrudSearchComponent } from '../../../shared/components/crud/crud-search.component';
import { MarketService } from './market.service';
import { TicketExchangeResponse } from '../../../shared/models/ticket-exchange.model';
import { Observable } from 'rxjs';

interface MarketQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  keyword?: string;
}

function toQueryDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseQueryDate(value?: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    CrudComponent,
    CrudSearchComponent
  ],
  providers: [
    provideDateFnsAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: vi }
  ],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class MarketComponent extends BaseCrudComponent<TicketExchangeResponse, MarketQuery, any> {
  private marketService = inject(MarketService);

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  constructor() {
    super();
    this.dateRange.valueChanges.pipe(takeUntilDestroyed()).subscribe(({ start, end }) => {
      if (start && !end) return;

      this.query.startDate = start ? toQueryDate(start) : undefined;
      this.query.endDate = end ? toQueryDate(end) : undefined;
      this.onSearch();
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.syncDateRangeFromQuery();
  }

  override onReset(): void {
    super.onReset();
    this.syncDateRangeFromQuery();
  }

  private syncDateRangeFromQuery(): void {
    this.dateRange.setValue(
      {
        start: parseQueryDate(this.query.startDate),
        end: parseQueryDate(this.query.endDate)
      },
      { emitEvent: false }
    );
  }

  getService() {
    return {
      query: (query: MarketQuery, page: number, size: number): Observable<any> => {
        // BaseCrudComponent has page 0-indexed, but getExchanges in API is 1-indexed.
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

    return {
      startDate: toQueryDate(monday),
      endDate: toQueryDate(sunday),
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
