import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentMemberOrder } from '@shared/models/meal-order.model';

type OrderFilter = 'ALL' | 'ORDERED' | 'NOT_ORDERED';

@Component({
  selector: 'app-department-meal-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-meal-list-modal.component.html',
  styleUrls: ['./department-meal-list-modal.component.scss']
})
export class DepartmentMealListModalComponent {
  @Input() members: DepartmentMemberOrder[] = [];
  @Output() close = new EventEmitter<void>();

  selectedFilter: OrderFilter = 'ALL';

  get filteredMembers(): DepartmentMemberOrder[] {
    switch (this.selectedFilter) {
      case 'ORDERED':
        return this.members.filter(m => m.hasOrdered);
      case 'NOT_ORDERED':
        return this.members.filter(m => !m.hasOrdered);
      default:
        return this.members;
    }
  }

  get orderedCount(): number {
    return this.members.filter(m => m.hasOrdered).length;
  }

  get notOrderedCount(): number {
    return this.members.length - this.orderedCount;
  }

  get departmentName(): string {
    return this.members[0]?.departmentName ?? '';
  }

  setFilter(filter: OrderFilter): void {
    this.selectedFilter = filter;
  }

  onClose(): void {
    this.close.emit();
  }
}
