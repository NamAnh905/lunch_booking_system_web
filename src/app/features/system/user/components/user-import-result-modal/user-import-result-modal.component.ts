import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { UserImportResultResponse } from '@shared/models/user.model';

@Component({
  selector: 'app-user-import-result-modal',
  standalone: true,
  templateUrl: './user-import-result-modal.component.html',
  styleUrl: './user-import-result-modal.component.scss'
})
export class UserImportResultModalComponent {
  @Input({ required: true }) result!: UserImportResultResponse;
  @Input() fileName = '';

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }
}
