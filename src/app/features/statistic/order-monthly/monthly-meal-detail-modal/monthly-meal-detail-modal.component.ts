import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderMonthlyService } from '../order-monthly.service';

@Component({
  selector: 'app-monthly-meal-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monthly-meal-detail-modal.component.html',
  styleUrls: ['./monthly-meal-detail-modal.component.scss']
})
export class MonthlyMealDetailModalComponent implements OnInit {
  @Input() userId!: number;
  @Input() userName!: string;
  @Input() totalMeals!: number;
  @Input() month!: number;
  @Input() year!: number;
  
  @Output() close = new EventEmitter<void>();
  
  days: { day: number, hasOrder: boolean }[] = [];

  constructor(private orderMonthlyService: OrderMonthlyService) {}

  ngOnInit(): void {
    this.generateDays();
    this.loadUserOrders();
  }

  generateDays(): void {
    const daysInMonthCount = new Date(this.year, this.month, 0).getDate();
    this.days = Array.from({ length: daysInMonthCount }, (_, i) => ({
      day: i + 1,
      hasOrder: false
    }));
  }

  loadUserOrders(): void {
    // Note: This calls the mocked endpoint in service.
    // In real app, the API should return a list of dates this user ordered in this month.
    const fromDate = `${this.year}-${this.month.toString().padStart(2, '0')}-01`;
    const toDate = `${this.year}-${this.month.toString().padStart(2, '0')}-${this.days.length}`;
    
    this.orderMonthlyService.getUserOrders(this.userId, fromDate, toDate).subscribe({
      next: (res) => {
        if (res.result) {
          const orders = res.result;
          console.log('List order dates:', orders);
          orders.forEach((order: any) => {
             // Theo logic thống kê của backend (OrderSummaryRepository), 
             // chỉ tính những đơn đã được chốt (status != 'CANCELLED')
             if (order.status !== 'CANCELLED') {
                // Handle both array [YYYY, MM, DD] and string "YYYY-MM-DD"
                let day: number | null = null;
                const targetDate = order.menuDate || order.orderDate;
                if (Array.isArray(targetDate)) {
                  day = targetDate[2];
                } else if (typeof targetDate === 'string') {
                  const dateParts = targetDate.split('-');
                  if (dateParts.length === 3) {
                    day = parseInt(dateParts[2], 10);
                  }
                } else if (targetDate instanceof Date) {
                  day = targetDate.getDate();
                }
                
                if (day !== null && !isNaN(day)) {
                  const dayObj = this.days.find(d => d.day === day);
                  if (dayObj) {
                    dayObj.hasOrder = true;
                  }
                }
             }
          });
        }
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
