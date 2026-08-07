import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SortDirection, SortState } from '@shared/utils/sort.util';

@Component({
  selector: 'th[appSortHeader]',
  standalone: true,
  template: `
    <span class="sort-header">
      <ng-content />
      <i class="fas" [class.fa-sort]="!isActive" [class.fa-sort-up]="isActive && direction === 'asc'"
        [class.fa-sort-down]="isActive && direction === 'desc'" aria-hidden="true"></i>
    </span>
  `,
  host: {
    'class': 'sortable',
    'role': 'columnheader',
    'tabindex': '0',
    '[class.sorted]': 'isActive',
    '[attr.aria-sort]': 'ariaSort',
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': 'toggle(); $event.preventDefault()'
  }
})
export class SortHeaderComponent {
  @Input({ alias: 'appSortHeader', required: true }) field = '';
  @Input() sort: SortState | null = null;
  @Output() sortChange = new EventEmitter<SortState>();

  get isActive(): boolean {
    return this.sort?.field === this.field;
  }

  get direction(): SortDirection {
    return this.sort?.direction ?? 'asc';
  }

  get ariaSort(): string {
    if (!this.isActive) return 'none';
    return this.direction === 'asc' ? 'ascending' : 'descending';
  }

  toggle(): void {
    const direction: SortDirection = this.isActive && this.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ field: this.field, direction });
  }
}
