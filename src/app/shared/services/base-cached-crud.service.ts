import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, shareReplay, switchMap } from 'rxjs/operators';

export abstract class BaseCachedCrudService {
  private readonly cache = new Map<string, Observable<unknown>>();
  protected readonly refresh$ = new BehaviorSubject<void>(undefined);

  clearCache(): void {
    this.cache.clear();
    this.refresh$.next();
  }

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
