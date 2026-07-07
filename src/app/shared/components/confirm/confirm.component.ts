import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmRequest } from '../../../core/services/confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen && request) {
      <div class="modal-overlay">
        <div class="modal-content confirm-modal">
          <div class="modal-header">
            <h3>{{ request.title }}</h3>
            <button class="close-btn" (click)="onCancel()">&times;</button>
          </div>
          <div class="modal-body">
            <p class="confirm-message">{{ request.message }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="onCancel()">{{ request.cancelText }}</button>
            <button class="btn btn-danger" (click)="onConfirm()">{{ request.confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm.component.scss'
})
export class ConfirmComponent implements OnInit, OnDestroy {
  private confirmService = inject(ConfirmService);
  private subscription!: Subscription;
  
  request: ConfirmRequest | null = null;
  isOpen = false;

  ngOnInit() {
    this.subscription = this.confirmService.confirm$.subscribe(request => {
      this.request = request;
      this.isOpen = true;
    });
  }

  onConfirm() {
    if (this.request) {
      this.request.resolve(true);
      this.close();
    }
  }

  onCancel() {
    if (this.request) {
      this.request.resolve(false);
      this.close();
    }
  }
  
  close() {
    this.isOpen = false;
    setTimeout(() => {
      this.request = null;
    }, 200);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
