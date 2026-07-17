import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-crud-actions',
  standalone: true,
  templateUrl: './crud-actions.component.html',
})
export class CrudActionsComponent {
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() showPreview = false;
  @Input() showStatus = false;
  @Input() active = true;

  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() toggleStatus = new EventEmitter<void>();
}
