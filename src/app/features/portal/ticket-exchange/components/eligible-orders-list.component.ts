import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { OrderResponse } from '@shared/models';

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
