import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, map, tap } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models';
import { NotificationResponse } from '@shared/models/notification.model';

interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  last: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private apiUrl = `${environment.apiUrl}/notifications`;

  private readonly listSize = 20;
  private readonly reconnectBaseDelayMs = 2000;
  private readonly reconnectMaxDelayMs = 60000;

  private notificationsSubject = new BehaviorSubject<NotificationResponse[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private hasMoreSubject = new BehaviorSubject<boolean>(false);
  hasMore$ = this.hasMoreSubject.asObservable();

  private loadingMoreSubject = new BehaviorSubject<boolean>(false);
  loadingMore$ = this.loadingMoreSubject.asObservable();

  private incomingSubject = new Subject<NotificationResponse>();
  incoming$ = this.incomingSubject.asObservable();

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private loadedPage = 0;

  start(): void {
    this.refresh();
    this.openStream();
  }

  stop(): void {
    this.closeStream();
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.hasMoreSubject.next(false);
    this.loadingMoreSubject.next(false);
    this.loadedPage = 0;
  }

  refresh(): void {
    this.loadedPage = 0;
    this.fetchPage(0).subscribe({
      next: (page) => {
        this.notificationsSubject.next(page?.content ?? []);
        this.hasMoreSubject.next(!(page?.last ?? true));
      },
      error: () => {},
    });

    this.http.get<ApiResponse<number>>(`${this.apiUrl}/me/unread-count`).subscribe({
      next: (res) => this.unreadCountSubject.next(res.result ?? 0),
      error: () => {},
    });
  }

  loadMore(): void {
    if (!this.hasMoreSubject.value || this.loadingMoreSubject.value) {
      return;
    }

    const nextPage = this.loadedPage + 1;
    this.loadingMoreSubject.next(true);

    this.fetchPage(nextPage).subscribe({
      next: (page) => {
        const known = new Set(this.notificationsSubject.value.map((item) => item.id));
        const fresh = (page?.content ?? []).filter((item) => !known.has(item.id));

        this.notificationsSubject.next([...this.notificationsSubject.value, ...fresh]);
        this.hasMoreSubject.next(!(page?.last ?? true));
        this.loadedPage = nextPage;
        this.loadingMoreSubject.next(false);
      },
      error: () => this.loadingMoreSubject.next(false),
    });
  }

  private fetchPage(page: number): Observable<NotificationPage | undefined> {
    return this.http
      .get<ApiResponse<NotificationPage>>(`${this.apiUrl}/me`, {
        params: { page, size: this.listSize },
      })
      .pipe(map((res) => res.result));
  }

  markAsRead(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        );
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
      })
    );
  }

  markAllAsRead(): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map((item) => ({ ...item, isRead: true }));
        this.notificationsSubject.next(updated);
        this.unreadCountSubject.next(0);
      })
    );
  }

  private openStream(): void {
    this.closeStream();

    const source = new EventSource(`${this.apiUrl}/stream`, { withCredentials: true });
    this.eventSource = source;

    source.addEventListener('notification', (event) => {
      this.zone.run(() => this.onIncoming((event as MessageEvent).data));
    });

    source.onopen = () => {
      this.reconnectAttempts = 0;
    };

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        this.zone.run(() => this.scheduleReconnect());
      }
    };
  }

  private onIncoming(raw: string): void {
    let notification: NotificationResponse;
    try {
      notification = JSON.parse(raw) as NotificationResponse;
    } catch {
      return;
    }

    if (this.notificationsSubject.value.some((item) => item.id === notification.id)) {
      return;
    }

    this.notificationsSubject.next([notification, ...this.notificationsSubject.value]);
    if (!notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
    this.incomingSubject.next(notification);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      this.reconnectBaseDelayMs * Math.pow(2, this.reconnectAttempts),
      this.reconnectMaxDelayMs
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.refresh();
      this.openStream();
    }, delay);
  }

  private closeStream(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
