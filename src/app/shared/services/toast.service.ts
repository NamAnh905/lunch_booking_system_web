import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  showSuccess(message: string) {
    this.show({ type: 'success', message });
  }

  showError(message: string) {
    this.show({ type: 'error', message });
  }

  showWarning(message: string) {
    this.show({ type: 'warning', message });
  }

  showInfo(message: string) {
    this.show({ type: 'info', message });
  }

  private show(toast: ToastMessage) {
    toast.id = Math.random().toString(36).substring(2, 9);
    this.toastSubject.next(toast);
  }
}
