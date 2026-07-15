import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { OrderResponse } from '@shared/models';

/**
 * Presentation component (dumb): hiển thị các đơn đủ điều kiện pass vé
 * và thông báo cảnh báo khi ngoài khung giờ. Phát sự kiện "post".
 */
@Component({
  selector: 'app-eligible-orders-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './eligible-orders-list.component.html',
  styleUrl: './ticket-card.styles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EligibleOrdersListComponent {
  orders = input.required<OrderResponse[]>();
  pendingOrderWarning = input<string | null>(null);
  isLoading = input(false);

  post = output<OrderResponse>();
}
