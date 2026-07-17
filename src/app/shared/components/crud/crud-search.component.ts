import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crud-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crud-search.component.html',
  styleUrl: './crud-search.component.scss',
})
export class CrudSearchComponent {
  @Input() value?: string = '';
  @Input() placeholder = 'Tìm kiếm...';
  @Input() width = '250px';

  @Output() valueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();

  @HostBinding('style.width') get hostWidth(): string {
    return this.width;
  }

  onValueChange(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  onSearch(): void {
    this.search.emit();
  }
}
