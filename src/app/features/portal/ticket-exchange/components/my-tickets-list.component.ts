import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TicketExchangeResponse } from '@shared/models';
import { ticketStatusLabel } from './ticket-status.util';

@Component({
  selector: 'app-my-tickets-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './my-tickets-list.component.html',
  styleUrl: './ticket-card.styles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTicketsListComponent {
  tickets = input.required<TicketExchangeResponse[]>();
  isLoading = input(false);

  withdraw = output<TicketExchangeResponse>();

  statusLabel = ticketStatusLabel;
}
