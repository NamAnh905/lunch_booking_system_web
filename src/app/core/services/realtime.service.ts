import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Owns the single server-sent events connection for the app. A page may only
 * hold a handful of concurrent HTTP/1.1 connections per origin and an SSE stream
 * never closes, so every feature that needs push data shares this one stream and
 * filters by event name rather than opening its own.
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private zone = inject(NgZone);
  private streamUrl = `${environment.apiUrl}/notifications/stream`;

  private readonly reconnectBaseDelayMs = 2000;
  private readonly reconnectMaxDelayMs = 60000;

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;

  private subjects = new Map<string, Subject<unknown>>();

  private connectedSubject = new Subject<void>();
  connected$ = this.connectedSubject.asObservable();

  start(): void {
    this.openStream();
  }

  stop(): void {
    this.closeStream();
  }

  on<T>(eventName: string): Observable<T> {
    return this.subjectFor(eventName).asObservable() as Observable<T>;
  }

  private subjectFor(eventName: string): Subject<unknown> {
    let subject = this.subjects.get(eventName);
    if (!subject) {
      subject = new Subject<unknown>();
      this.subjects.set(eventName, subject);
      if (this.eventSource) {
        this.attach(this.eventSource, eventName);
      }
    }
    return subject;
  }

  private openStream(): void {
    this.closeStream();

    const source = new EventSource(this.streamUrl, { withCredentials: true });
    this.eventSource = source;

    this.subjects.forEach((_, eventName) => this.attach(source, eventName));

    source.onopen = () => {
      this.reconnectAttempts = 0;
      this.zone.run(() => this.connectedSubject.next());
    };

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        this.zone.run(() => this.scheduleReconnect());
      }
    };
  }

  private attach(source: EventSource, eventName: string): void {
    source.addEventListener(eventName, (event) => {
      this.zone.run(() => this.emit(eventName, (event as MessageEvent).data));
    });
  }

  private emit(eventName: string, raw: string): void {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    this.subjects.get(eventName)?.next(payload);
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
