import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TicketExchangeResponse } from '@shared/models';
import { ticketStatusLabel } from './ticket-status.util';

@Component({
  selector: 'app-market-tickets-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './market-tickets-list.component.html',
  styleUrl: './ticket-card.styles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketTicketsListComponent {
  tickets = input.required<TicketExchangeResponse[]>();
  currentUserId = input<number>();
  isLoading = input(false);

  claim = output<TicketExchangeResponse>();

  statusLabel = ticketStatusLabel;
}
