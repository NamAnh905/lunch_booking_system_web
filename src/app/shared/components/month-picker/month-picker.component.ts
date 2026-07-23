import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="month-picker">
      <button type="button" class="month-picker__trigger" (click)="toggle()">
        <span class="month-picker__label">{{ displayLabel }}</span>
        <svg class="month-picker__caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      @if (isOpen) {
        <div class="month-picker__panel">
          <div class="month-picker__header">
            <button type="button" class="month-picker__nav" (click)="changeYear(-1)" aria-label="Năm trước">&lsaquo;</button>
            <span class="month-picker__year">{{ viewYear }}</span>
            <button type="button" class="month-picker__nav" (click)="changeYear(1)" aria-label="Năm sau">&rsaquo;</button>
          </div>

          <div class="month-picker__grid">
            @for (label of months; track $index) {
              <button type="button" class="month-picker__month"
                      [class.selected]="$index + 1 === month && viewYear === year"
                      (click)="selectMonth($index + 1)">
                {{ label }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './month-picker.component.scss'
})
export class MonthPickerComponent {
  @Input() month: number = new Date().getMonth() + 1;
  @Input() year: number = new Date().getFullYear();

  @Output() monthChange = new EventEmitter<number>();
  @Output() yearChange = new EventEmitter<number>();
  @Output() selected = new EventEmitter<{ month: number; year: number }>();

  isOpen = false;
  viewYear: number = this.year;

  readonly months = Array.from({ length: 12 }, (_, i) => `Thg ${i + 1}`);

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get displayLabel(): string {
    return `${String(this.month).padStart(2, '0')}/${this.year}`;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.viewYear = this.year;
    }
  }

  changeYear(delta: number): void {
    this.viewYear += delta;
  }

  selectMonth(month: number): void {
    this.month = month;
    this.year = this.viewYear;
    this.monthChange.emit(month);
    this.yearChange.emit(this.viewYear);
    this.selected.emit({ month, year: this.viewYear });
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
  }
}
