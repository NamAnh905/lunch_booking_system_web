import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TicketExchangeService } from './ticket-exchange.service';
import { AuthService } from '@core/auth/auth.service';
import { MealOrderService } from '../meal-order/meal-order.service';
import { OrderResponse, TicketExchangeResponse } from '@shared/models';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ticket-exchange',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatTabsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './ticket-exchange.component.html',
  styleUrl: './ticket-exchange.component.scss'
})
export class TicketExchangeComponent implements OnInit {
  private ticketExchangeService = inject(TicketExchangeService);
  private authService = inject(AuthService);
  private mealOrderService = inject(MealOrderService);
  private router = inject(Router);

  currentUserId: number | undefined;
  usernameDisplay = 'User';
  dropdownOpen = false;

  marketTickets: TicketExchangeResponse[] = [];
  myTickets: TicketExchangeResponse[] = [];
  eligibleOrders: OrderResponse[] = [];
  
  isLoading = false;
  pendingOrderWarning: string | null = null;
  
  totalElements = 0;
  pageSize = 10;
  currentPage = 1;

  selectedStatus: string | null = 'OPEN';
  keyword: string | null = null;

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUserId = user?.userId;
    if (user) {
      this.usernameDisplay = `CNVT ${user.username}`;
    }
    this.loadMyTickets();
    this.fetchEligibleOrders();
    this.loadMarketTickets();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  isValidExchangeTime(menuDateStr: string): boolean {
    const orderDate = new Date(menuDateStr);
    orderDate.setHours(0, 0, 0, 0);

    const now = new Date();
    
    const cutOffStart = new Date(orderDate);
    cutOffStart.setDate(cutOffStart.getDate() - 1);
    cutOffStart.setHours(14, 45, 0, 0);
    
    const cutOffEnd = new Date(orderDate);
    cutOffEnd.setHours(10, 30, 0, 0);
    
    return now >= cutOffStart && now <= cutOffEnd;
  }

  loadMarketTickets(): void {
    this.isLoading = true;
    this.ticketExchangeService.getMarketTickets(this.currentPage, this.pageSize, 'OPEN', null).subscribe({
      next: (res) => {
        console.log('loadMarketTickets response:', res);
        const data = res.result?.data || [];
        // Tạm thời comment logic loại trừ vé của chính mình để test
        // this.marketTickets = data.filter(t => t.sellerId !== this.currentUserId);
        this.marketTickets = data;
        this.totalElements = res.result?.totalElements || 0;
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
    const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // We fetch orders for the next 30 days to check eligible ones
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    this.mealOrderService.getMyOrders(startStr, endStr).subscribe({
      next: (res) => {
        const allOrders = res.result || [];
        const pendingOrders = allOrders.filter(o => 
          o.status === 'PENDING' && 
          !this.myTickets.some(t => t.orderId === o.id)
        );
        
        this.eligibleOrders = pendingOrders.filter(o => this.isValidExchangeTime(o.menuDate));

        if (this.eligibleOrders.length === 0 && pendingOrders.length > 0) {
          // Find the closest pending order to determine warning message
          const closestOrder = pendingOrders.sort((a, b) => new Date(a.menuDate).getTime() - new Date(b.menuDate).getTime())[0];
          
          const orderDate = new Date(closestOrder.menuDate);
          orderDate.setHours(0,0,0,0);
          const cutOffStart = new Date(orderDate);
          cutOffStart.setDate(cutOffStart.getDate() - 1);
          cutOffStart.setHours(14, 45, 0, 0);
          
          const cutOffEnd = new Date(orderDate);
          cutOffEnd.setHours(10, 30, 0, 0);

          const now = new Date();
          if (now < cutOffStart) {
            this.pendingOrderWarning = `Chưa đến giờ pass vé ngày ${closestOrder.menuDate} (chỉ được pass sau 14h45 ngày hôm trước).`;
          } else if (now > cutOffEnd) {
            this.pendingOrderWarning = `Đã quá hạn pass vé ngày ${closestOrder.menuDate} (chỉ được pass trước 10h30 hôm nay).`;
          }
        } else {
          this.pendingOrderWarning = null;
        }
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  get startItem(): number {
    if (this.totalElements === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalElements ? this.totalElements : end;
  }

  onPageChangeCustom(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMarketTickets();
    }
  }

  onSizeChangeCustom(event: Event): void {
    const size = parseInt((event.target as HTMLSelectElement).value, 10);
    this.pageSize = size;
    this.currentPage = 1;
    this.loadMarketTickets();
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
      confirmButtonColor: '#d33',
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
    let errorMsg = 'Đã có lỗi xảy ra, vui lòng thử lại!';
    
    if (err.error && err.error.code) {
      switch (err.error.code) {
        case 'ORDER_CUTOFF_REACHED':
        case 'ORDER_CANNOT_PASS':
          errorMsg = 'Nằm ngoài khung giờ cho phép (14h45 hôm trước đến 10h30 hôm nay)!';
          break;
        case 'ORDER_ALREADY_EXISTS':
          errorMsg = 'Bạn đã có suất ăn trong ngày này, không thể nhận thêm!';
          break;
        case 'EXCHANGE_NOT_FOUND':
        case 'EXCHANGE_NOT_OPEN':
        case 'CANNOT_CLAIM_OWN_TICKET':
          errorMsg = 'Vé này đã bị người khác nhận mất, vui lòng tải lại trang!';
          break;
        default:
          errorMsg = err.error.message || errorMsg;
      }
    } else if (err.error && err.error.message) {
      const msg = err.error.message.toLowerCase();
      if (msg.includes('lock') || msg.includes('optimistic') || msg.includes('đã nhận')) {
        errorMsg = 'Vé này đã bị người khác nhận mất, vui lòng tải lại trang!';
      } else if (msg.includes('trùng') || msg.includes('đã có')) {
        errorMsg = 'Bạn đã có suất ăn trong ngày này, không thể nhận thêm!';
      } else if (msg.includes('cut-off') || msg.includes('chốt')) {
        errorMsg = 'Nằm ngoài khung giờ cho phép (14h45 hôm trước đến 10h30 hôm nay)!';
      } else {
        errorMsg = err.error.message;
      }
    }

    Swal.fire({
      title: 'Lỗi!',
      text: errorMsg,
      icon: 'error',
      confirmButtonText: 'Đóng'
    });
  }
}
