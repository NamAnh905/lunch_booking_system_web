import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { TicketExchangeService } from './ticket-exchange.service';
import { AuthService } from '@core/auth/auth.service';
import { MealOrderService } from '../meal-order/meal-order.service';
import { OrderResponse, TicketExchangeResponse } from '@shared/models';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ExchangeWindowService } from './services/exchange-window.service';
import { ExchangeErrorMapper } from './services/exchange-error.mapper';
import { toIsoDate } from '@shared/utils/date.util';
import { OrderStatus, TicketExchangeStatus } from '@shared/enums';
import { SWAL_COLORS, DEFAULT_PAGE_SIZE } from '@shared/constants/business.constants';
import { MarketTicketsListComponent } from './components/market-tickets-list.component';
import { EligibleOrdersListComponent } from './components/eligible-orders-list.component';
import { MyTicketsListComponent } from './components/my-tickets-list.component';

@Component({
  selector: 'app-ticket-exchange',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatDividerModule,
    FormsModule,
    MarketTicketsListComponent,
    EligibleOrdersListComponent,
    MyTicketsListComponent
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

  currentUserId: number | undefined;

  marketTickets: TicketExchangeResponse[] = [];
  myTickets: TicketExchangeResponse[] = [];
  eligibleOrders: OrderResponse[] = [];
  
  isLoading = false;
  pendingOrderWarning: string | null = null;

  pageSize = DEFAULT_PAGE_SIZE;
  currentPage = 1;

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.userId;
    this.loadMyTickets();
    this.fetchEligibleOrders();
    this.loadMarketTickets();
  }

  isValidExchangeTime(menuDateStr: string): boolean {
    return this.exchangeWindow.isValidExchangeTime(menuDateStr);
  }

  loadMarketTickets(): void {
    this.isLoading = true;
    this.ticketExchangeService.getMarketTickets(this.currentPage, this.pageSize, TicketExchangeStatus.OPEN, null).subscribe({
      next: (res) => {
        const data = res.result?.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleError(err);
      }
    });
  }

  loadMyTickets(): void {
    const user = this.authService.currentUserValue;
    if (!user) return;
    
    this.ticketExchangeService.getMyListedTickets().subscribe({
      next: (res) => {
        this.myTickets = res.result || [];
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  fetchEligibleOrders(): void {
    const today = new Date();
    const startStr = toIsoDate(today);

    // We fetch orders for the next 30 days to check eligible ones
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const endStr = toIsoDate(end);

    this.mealOrderService.getMyOrders(startStr, endStr).subscribe({
      next: (res) => {
        const allOrders = res.result || [];
        const pendingOrders = allOrders.filter(o =>
          o.status === OrderStatus.PENDING &&
          !this.isClaimedTicket(o) &&
          !this.myTickets.some(t => t.orderId === o.id)
        );
        
        this.eligibleOrders = pendingOrders.filter(o => this.isValidExchangeTime(o.menuDate));

        if (this.eligibleOrders.length === 0 && pendingOrders.length > 0) {
          const closestOrder = pendingOrders.sort((a, b) => new Date(a.menuDate).getTime() - new Date(b.menuDate).getTime())[0];
        } else {
          this.pendingOrderWarning = null;
        }
      }
    });
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
            Swal.fire('Thành công', 'Nhận vé thành công!', 'success');
            this.loadMyTickets();
            this.fetchEligibleOrders();
            this.loadMarketTickets();
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
              Swal.fire('Thành công', 'Đăng vé lên chợ thành công!', 'success');
              this.loadMyTickets();
              this.fetchEligibleOrders();
              this.loadMarketTickets();
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
            Swal.fire('Thành công', 'Thu hồi vé thành công!', 'success');
            this.loadMyTickets();
            this.fetchEligibleOrders();
            this.loadMarketTickets();
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
    Swal.fire({
      title: 'Lỗi!',
      text: this.errorMapper.map(err),
      icon: 'error',
      confirmButtonText: 'Đóng'
    });
  }
}
