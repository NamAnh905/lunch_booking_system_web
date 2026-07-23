import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ToastService } from '@core/services/toast.service';
import { NotificationResponse } from '@shared/models/notification.model';
import {
  NOTIFICATION_COLLAPSED_LIMIT,
  NOTIFICATION_FILTERS,
  NOTIFICATION_GROUPS,
  NotificationFilter,
} from '@shared/constants/notification.constants';

const ARROW_FALLBACK_OFFSET_PX = 18;

interface NotificationGroup {
  label: string;
  items: NotificationResponse[];
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  @Output() openChange = new EventEmitter<boolean>();

  protected readonly notifications = toSignal(this.notificationService.notifications$, {
    initialValue: [] as NotificationResponse[],
  });
  protected readonly unreadCount = toSignal(this.notificationService.unreadCount$, {
    initialValue: 0,
  });
  protected readonly hasMore = toSignal(this.notificationService.hasMore$, {
    initialValue: false,
  });
  protected readonly loadingMore = toSignal(this.notificationService.loadingMore$, {
    initialValue: false,
  });

  protected readonly filters = NOTIFICATION_FILTERS;

  protected readonly dropdownOpen = signal(false);
  protected readonly expanded = signal(false);
  protected readonly filter = signal<NotificationFilter>('all');
  protected readonly panelOffset = signal(0);
  protected readonly arrowOffset = signal(0);

  protected readonly filtered = computed(() =>
    this.filter() === 'unread'
      ? this.notifications().filter((item) => !item.isRead)
      : this.notifications()
  );

  protected readonly hiddenCount = computed(() =>
    Math.max(0, this.filtered().length - NOTIFICATION_COLLAPSED_LIMIT)
  );

  protected readonly canExpand = computed(() =>
    this.expanded() ? this.hasMore() : this.hiddenCount() > 0 || this.hasMore()
  );

  protected readonly groups = computed<NotificationGroup[]>(() => {
    const items = this.expanded()
      ? this.filtered()
      : this.filtered().slice(0, NOTIFICATION_COLLAPSED_LIMIT);

    return NOTIFICATION_GROUPS.map((group) => ({
      label: group.label,
      items: items.filter((item) => this.bucketOf(item) === group.key),
    })).filter((group) => group.items.length > 0);
  });

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
  protected onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.setOpen(false);
    }
  }

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.dropdownOpen()) {
      this.measurePlacement();
    }
  }

  protected toggleDropdown(): void {
    this.setOpen(!this.dropdownOpen());
  }

  protected setFilter(value: NotificationFilter, event: Event): void {
    event.stopPropagation();
    this.filter.set(value);
  }

  protected onExpand(event: Event): void {
    event.stopPropagation();

    if (!this.expanded()) {
      this.expanded.set(true);
      return;
    }

    this.notificationService.loadMore();
  }

  protected onSelect(notification: NotificationResponse): void {
    if (notification.isRead) {
      return;
    }
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  protected onMarkAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }

  private setOpen(open: boolean): void {
    if (this.dropdownOpen() === open) {
      return;
    }
    if (open) {
      this.measurePlacement();
    } else {
      this.expanded.set(false);
    }
    this.dropdownOpen.set(open);
    this.openChange.emit(open);
  }

  private measurePlacement(): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    const bell = host.querySelector<HTMLElement>('.bell-button');
    const container = host.closest<HTMLElement>('.container');

    if (!bell || !container) {
      this.panelOffset.set(0);
      this.arrowOffset.set(ARROW_FALLBACK_OFFSET_PX);
      return;
    }

    const bellRect = bell.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const containerRight = container.getBoundingClientRect().right;

    this.panelOffset.set(Math.max(0, containerRight - hostRect.right));
    this.arrowOffset.set(Math.max(0, containerRight - (bellRect.left + bellRect.width / 2)));
  }

  private bucketOf(notification: NotificationResponse): string {
    const created = new Date(notification.createdAt);
    if (Number.isNaN(created.getTime())) {
      return 'earlier';
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (created.getTime() >= startOfToday.getTime()) {
      return 'today';
    }

    const startOfWeekAgo = startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000;
    return created.getTime() >= startOfWeekAgo ? 'week' : 'earlier';
  }
}
