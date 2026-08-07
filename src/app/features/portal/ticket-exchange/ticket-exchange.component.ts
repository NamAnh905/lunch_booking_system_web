import { Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { TicketExchangeService } from './ticket-exchange.service';
import { AuthService } from '@core/auth/auth.service';
import { RealtimeService } from '@core/services/realtime.service';
import { MealOrderService } from '../meal-order/meal-order.service';
import { OrderResponse, TicketExchangeResponse } from '@shared/models';
import { REALTIME_EVENTS } from '@shared/constants/realtime.constants';
import { FormsModule } from '@angular/forms';
import { forkJoin, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ExchangeWindowService } from './services/exchange-window.service';
import { ExchangeErrorMapper } from './services/exchange-error.mapper';
import { toIsoDate } from '@shared/utils/date.util';
import { OrderStatus } from '@shared/enums';
import { PASSABLE_ORDER_STATUSES, SWAL_COLORS } from '@shared/constants/business.constants';
import { MarketTicketsListComponent } from './components/market-tickets-list.component';
import { EligibleOrdersListComponent } from './components/eligible-orders-list.component';
import { MyTicketsListComponent } from './components/my-tickets-list.component';
import { TicketTabsComponent } from './components/ticket-tabs.component';

@Component({
  selector: 'app-ticket-exchange',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDividerModule,
    FormsModule,
    MarketTicketsListComponent,
    EligibleOrdersListComponent,
    MyTicketsListComponent,
    TicketTabsComponent
  ],
  templateUrl: './ticket-exchange.component.html',
  styleUrl: './ticket-exchange.component.scss'
})
export class TicketExchangeComponent implements OnInit {
  private ticketExchangeService = inject(TicketExchangeService);
  private authService = inject(AuthService);
  private mealOrderService = inject(MealOrderService);
  private exchangeWindow = inject(ExchangeWindowService);
  private errorMapper = inject(ExchangeErrorMapper);
  private realtime = inject(RealtimeService);
  private destroyRef = inject(DestroyRef);

  @ViewChild(MarketTicketsListComponent) private marketList?: MarketTicketsListComponent;

  currentUserId: number | undefined;

  readonly tabLabels = ['Chợ vé', 'Vé của tôi'];
  readonly activeTabIndex = signal(0);

  myTickets: TicketExchangeResponse[] = [];
  eligibleOrders: OrderResponse[] = [];

  isLoading = false;
  pendingOrderWarning: string | null = null;

  hasTicketOnMarket = false;
  hasOwnedTicket = false;

  get isClaimBlocked(): boolean {
    return this.hasTicketOnMarket || this.hasOwnedTicket;
  }

  get claimBlockedReason(): string | null {
    if (this.hasTicketOnMarket) return 'Bạn đang pass vé trên chợ nên không thể nhận thêm vé';
    if (this.hasOwnedTicket) return 'Bạn đang có vé nên không thể nhận thêm vé';
    return null;
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.userId;
    this.refreshMyTab();

    merge(this.realtime.on(REALTIME_EVENTS.MARKET_CHANGED), this.realtime.connected$)
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshAll());
  }

  private refreshAll(): void {
    this.marketList?.loadData();
    this.refreshMyTab();
  }

  isValidExchangeTime(menuDateStr: string): boolean {
    return this.exchangeWindow.isValidExchangeTime(menuDateStr);
  }

  refreshMyTab(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;

    const today = new Date();
    const startStr = toIsoDate(today);

    // We fetch orders for the next 30 days to check eligible ones
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const endStr = toIsoDate(end);

    forkJoin({
      tickets: this.ticketExchangeService.getMyListedTickets(),
      orders: this.mealOrderService.getMyOrders(startStr, endStr)
    }).subscribe({
      next: ({ tickets, orders }) => {
        this.myTickets = tickets.result || [];
        const allOrders = orders.result || [];

        this.hasTicketOnMarket = this.myTickets.length > 0;
        this.hasOwnedTicket = allOrders.some(o => o.status !== OrderStatus.CANCELLED);

        this.applyEligibleOrders(allOrders);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  private applyEligibleOrders(allOrders: OrderResponse[]): void {
    const passableOrders = allOrders.filter(o =>
      PASSABLE_ORDER_STATUSES.includes(o.status) &&
      !this.isClaimedTicket(o) &&
      !this.myTickets.some(t => t.orderId === o.id)
    );

    this.eligibleOrders = passableOrders.filter(o => this.isValidExchangeTime(o.menuDate));

    if (this.eligibleOrders.length === 0 && passableOrders.length > 0) {
      const closestOrder = [...passableOrders].sort((a, b) => new Date(a.menuDate).getTime() - new Date(b.menuDate).getTime())[0];
      this.pendingOrderWarning = this.exchangeWindow.getWarning(closestOrder.menuDate);
    } else {
      this.pendingOrderWarning = null;
    }
  }

  private isClaimedTicket(order: OrderResponse): boolean {
    return order.originalUserId != null && order.originalUserId !== this.currentUserId;
  }

  claimTicket(ticket: TicketExchangeResponse): void {
    Swal.fire({
      title: 'Nhận vé?',
      text: `Bạn có chắc chắn muốn nhận vé ngày ${ticket.menuDate} từ ${ticket.sellerName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.ticketExchangeService.claimTicket(ticket.exchangeId).subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire('Thành công', 'Nhận vé thành công!', 'success');
            this.refreshAll();
          },
          error: (err) => {
            this.isLoading = false;
            this.handleError(err);
          }
        });
      }
    });
  }

  postTicket(order: OrderResponse): void {
    Swal.fire({
      title: 'Đăng lên chợ?',
      text: `Bạn có chắc chắn muốn đăng pass vé ngày ${order.menuDate}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        if (order.id !== undefined) {
          this.ticketExchangeService.postTicket({ orderId: order.id }).subscribe({
            next: () => {
              this.isLoading = false;
              Swal.fire('Thành công', 'Đăng vé lên chợ thành công!', 'success');
              this.refreshAll();
            },
            error: (err) => {
              this.isLoading = false;
              this.handleError(err);
            }
          });
        }
      }
    });
  }

  withdrawTicket(ticket: TicketExchangeResponse): void {
    Swal.fire({
      title: 'Thu hồi vé?',
      text: `Bạn có chắc chắn muốn thu hồi vé?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: SWAL_COLORS.DANGER,
      confirmButtonText: 'Thu hồi',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.ticketExchangeService.withdrawTicket(ticket.exchangeId).subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire('Thành công', 'Thu hồi vé thành công!', 'success');
            this.refreshAll();
          },
          error: (err) => {
            this.isLoading = false;
            this.handleError(err);
          }
        });
      }
    });
  }

  private handleError(err: any): void {
    if (this.errorMapper.isStaleTicket(err)) {
      this.refreshAll();
    }

    Swal.fire({
      title: 'Lỗi!',
      text: this.errorMapper.map(err),
      icon: 'error',
      confirmButtonText: 'Đóng'
    });
  }
}
