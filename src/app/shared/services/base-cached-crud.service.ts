import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, shareReplay, switchMap } from 'rxjs/operators';

/**
 * Lớp cha gom cơ chế cache dùng chung cho các service CRUD:
 *   Map (kho cache theo key) + refresh$ (cần gạt làm mới) + shareReplay (chia sẻ kết quả).
 *
 * Service con giữ nguyên chữ ký method và cách build params của mình, chỉ cần
 * bọc lời gọi HTTP bằng `this.cached(key, () => http.get(...))` và gọi
 * `this.clearCache()` sau add/edit/delete.
 */
export abstract class BaseCachedCrudService {
  private readonly cache = new Map<string, Observable<unknown>>();
  protected readonly refresh$ = new BehaviorSubject<void>(undefined);

  clearCache(): void {
    this.cache.clear();
    this.refresh$.next();
  }

  /**
   * Trả về luồng đã cache theo `key`. Nếu chưa có, dựng từ `requestFactory`,
   * chia sẻ kết quả cho mọi subscriber (shareReplay) và tự loại key khỏi cache khi lỗi.
   */
  protected cached<R>(key: string, requestFactory: () => Observable<R>): Observable<R> {
    const existing = this.cache.get(key) as Observable<R> | undefined;
    if (existing) {
      return existing;
    }

    const stream$ = this.refresh$.pipe(
      switchMap(() => requestFactory()),
      shareReplay(1),
      catchError((err) => {
        this.cache.delete(key);
        return throwError(() => err);
      })
    );
    this.cache.set(key, stream$);
    return stream$;
  }
}
