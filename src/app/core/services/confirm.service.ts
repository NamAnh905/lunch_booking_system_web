import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmRequest {
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<ConfirmRequest>();
  confirm$ = this.confirmSubject.asObservable();

  confirm(message: string, title: string = 'Xác nhận', confirmText: string = 'Xác nhận', cancelText: string = 'Hủy'): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.confirmSubject.next({
        message,
        title,
        confirmText,
        cancelText,
        resolve: (value: boolean) => {
          observer.next(value);
          observer.complete();
        }
      });
    });
  }
}
