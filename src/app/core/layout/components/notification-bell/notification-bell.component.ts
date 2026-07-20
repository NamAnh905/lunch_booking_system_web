import { Component, DestroyRef, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ToastService } from '@core/services/toast.service';
import { NotificationResponse } from '@shared/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  notifications$ = this.notificationService.notifications$;
  unreadCount$ = this.notificationService.unreadCount$;
  dropdownOpen = false;

  constructor() {
    this.authService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      if (user) {
        this.notificationService.start();
      } else {
        this.notificationService.stop();
      }
    });

    this.notificationService.incoming$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => this.toastService.showInfo(notification.title));

    this.destroyRef.onDestroy(() => this.notificationService.stop());
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onSelect(notification: NotificationResponse): void {
    if (notification.isRead) {
      return;
    }
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  onMarkAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }
}
