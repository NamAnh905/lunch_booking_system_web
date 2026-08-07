import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, map, tap } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models';
import { NotificationResponse } from '@shared/models/notification.model';
import { REALTIME_EVENTS } from '@shared/constants/realtime.constants';
import { RealtimeService } from './realtime.service';

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
  private realtime = inject(RealtimeService);
  private apiUrl = `${environment.apiUrl}/notifications`;

  private readonly listSize = 20;

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

  private loadedPage = 0;
  private awaitingFirstConnect = false;

  constructor() {
    this.realtime
      .on<NotificationResponse>(REALTIME_EVENTS.NOTIFICATION)
      .subscribe((notification) => this.onIncoming(notification));

    this.realtime.connected$.subscribe(() => {
      if (this.awaitingFirstConnect) {
        this.awaitingFirstConnect = false;
        return;
      }
      this.refresh();
    });
  }

  start(): void {
    this.awaitingFirstConnect = true;
    this.refresh();
    this.realtime.start();
  }

  stop(): void {
    this.realtime.stop();
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

  private onIncoming(notification: NotificationResponse): void {
    if (this.notificationsSubject.value.some((item) => item.id === notification.id)) {
      return;
    }

    this.notificationsSubject.next([notification, ...this.notificationsSubject.value]);
    if (!notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
    this.incomingSubject.next(notification);
  }
}
