import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { OrderStatus } from '@shared/enums';
import { SWAL_COLORS } from '@shared/constants/business.constants';
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
export class TicketExchangeComponent implements OnInit, AfterViewInit, OnDestroy {
  private ticketExchangeService = inject(TicketExchangeService);
  private authService = inject(AuthService);
  private mealOrderService = inject(MealOrderService);
  private exchangeWindow = inject(ExchangeWindowService);
  private errorMapper = inject(ExchangeErrorMapper);
  private zone = inject(NgZone);

  @ViewChild(MarketTicketsListComponent) private marketList?: MarketTicketsListComponent;
  @ViewChild('scaleWrapper') private scaleWrapper?: ElementRef<HTMLElement>;
  @ViewChild('scaleContent') private scaleContent?: ElementRef<HTMLElement>;

  private readonly SCALE_MIN_WIDTH = 768;
  private readonly SCALE_BOTTOM_GAP = 48;
  private resizeObserver?: ResizeObserver;
  private scaleFrame?: number;

  currentUserId: number | undefined;

  readonly tabLabels = ['Chợ vé', 'Vé của tôi'];
  readonly activeTabIndex = signal(0);

  myTickets: TicketExchangeResponse[] = [];
  eligibleOrders: OrderResponse[] = [];

  isLoading = false;
  pendingOrderWarning: string | null = null;

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.userId;
    this.loadMyTickets();
    this.fetchEligibleOrders();
  }

  ngAfterViewInit(): void {
    if (this.scaleContent) {
      this.zone.runOutsideAngular(() => {
        this.resizeObserver = new ResizeObserver(() => this.scheduleScaleFit());
        this.resizeObserver.observe(this.scaleContent!.nativeElement);
      });
    }
    this.scheduleScaleFit();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.scaleFrame) cancelAnimationFrame(this.scaleFrame);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleScaleFit();
  }

  private scheduleScaleFit(): void {
    if (this.scaleFrame) cancelAnimationFrame(this.scaleFrame);
    this.scaleFrame = requestAnimationFrame(() => this.applyScaleFit());
  }

  private applyScaleFit(): void {
    const wrapper = this.scaleWrapper?.nativeElement;
    const content = this.scaleContent?.nativeElement;
    if (!wrapper || !content) return;

    if (window.innerWidth < this.SCALE_MIN_WIDTH) {
      content.style.transform = '';
      content.style.transformOrigin = '';
      wrapper.style.height = '';
      return;
    }

    content.style.transform = 'none';
    const naturalHeight = content.offsetHeight;
    const naturalWidth = content.offsetWidth;
    if (naturalHeight === 0) return;

    const wrapperTop = wrapper.getBoundingClientRect().top;
    const availableHeight = window.innerHeight - wrapperTop - this.SCALE_BOTTOM_GAP;
    const availableWidth = wrapper.clientWidth;

    const scale = Math.min(1, availableHeight / naturalHeight, availableWidth / naturalWidth);

    content.style.transformOrigin = 'top center';
    content.style.transform = `scale(${scale})`;
    wrapper.style.height = `${naturalHeight * scale}px`;
  }

  isValidExchangeTime(menuDateStr: string): boolean {
    return this.exchangeWindow.isValidExchangeTime(menuDateStr);
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
          const closestOrder = [...pendingOrders].sort((a, b) => new Date(a.menuDate).getTime() - new Date(b.menuDate).getTime())[0];
          this.pendingOrderWarning = this.exchangeWindow.getWarning(closestOrder.menuDate);
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
            this.isLoading = false;
            Swal.fire('Thành công', 'Nhận vé thành công!', 'success');
            this.loadMyTickets();
            this.fetchEligibleOrders();
            this.marketList?.loadData();
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
              this.loadMyTickets();
              this.fetchEligibleOrders();
              this.marketList?.loadData();
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
            this.loadMyTickets();
            this.fetchEligibleOrders();
            this.marketList?.loadData();
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
