import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface CrudAddOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crud.component.html',
  styleUrl: './crud.component.scss',
})
export class CrudComponent {
  @Input() loading = false;
  @Input() total = 0;
  @Input() page = 1;
  @Input() size = 10;
  @Input() hideAdd = false;
  @Input() addOptions: CrudAddOption[] = [];

  @Input() permissions: { add?: string; edit?: string; delete?: string; export?: string } = {
    add: '',
    edit: '',
    delete: '',
    export: ''
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();
  @Output() add = new EventEmitter<void>();
  @Output() addOption = new EventEmitter<string>();
  @Output() export = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  sizeOptions = [10, 20, 50, 100];

  isAddMenuOpen = false;

  private elementRef = inject(ElementRef);

  get totalPages(): number {
    return Math.ceil(this.total / this.size);
  }

  get startItem(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.size + 1;
  }

  get endItem(): number {
    const end = this.page * this.size;
    return end > this.total ? this.total : end;
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages && newPage !== this.page) {
      this.pageChange.emit(newPage);
    }
  }

  onSizeChange(newSize: any): void {
    const sizeNum = Number(newSize);
    if (sizeNum !== this.size) {
      this.sizeChange.emit(sizeNum);
    }
  }

  onAdd(): void {
    if (this.addOptions.length > 0) {
      this.isAddMenuOpen = !this.isAddMenuOpen;
      return;
    }
    this.add.emit();
  }

  onAddOption(value: string): void {
    this.isAddMenuOpen = false;
    this.addOption.emit(value);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isAddMenuOpen) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isAddMenuOpen = false;
    }
  }

  onExport(): void {
    this.export.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  hasPermission(permission?: string): boolean {
    if (permission === undefined) return false;
    if (!permission) return true;
    return true;
  }
}
