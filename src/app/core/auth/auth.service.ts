import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, TokenResponse, UserClaims, UserInfo } from '@shared/models';
import { TokenStorageService } from './token.storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  private decodeToken(token: string): UserClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as UserClaims;
    } catch (e) {
      return null;
    }
  }

  private mapClaimsToUserInfo(claims: UserClaims): UserInfo {
    const scope = claims.scope || '';
    const roles: string[] = [];
    const permissions: string[] = [];

    scope.split(' ').forEach((item) => {
      if (item.startsWith('ROLE_')) {
        roles.push(item.substring(5)); // Strip ROLE_
      } else if (item.trim()) {
        permissions.push(item);
      }
    });

    return {
      username: claims.sub,
      userId: claims.userId,
      fullName: claims.fullName,
      roles,
      permissions,
    };
  }

  private handleAuthResponse(response: ApiResponse<TokenResponse>): TokenResponse {
    const tokenResult = response.result;
    if (tokenResult?.authenticated && tokenResult.token) {
      const claims = this.decodeToken(tokenResult.token);
      if (claims) {
        const userInfo = this.mapClaimsToUserInfo(claims);
        this.currentUserSubject.next(userInfo);
        this.tokenStorage.setLoggedIn(true, tokenResult.rememberMe === true);
      }
    } else {
      this.clearSession();
    }
    return tokenResult || { authenticated: false };
  }

  private clearSession(): void {
    this.currentUserSubject.next(null);
    this.tokenStorage.setLoggedIn(false);
  }

  public login(request: any): Observable<TokenResponse> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, request).pipe(
      map((res) => this.handleAuthResponse(res)),
      catchError((err) => {
        this.clearSession();
        throw err;
      })
    );
  }

  public refresh(): Observable<TokenResponse> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/refresh`, {}).pipe(
      map((res) => this.handleAuthResponse(res)),
      catchError((err) => {
        this.clearSession();
        throw err;
      })
    );
  }

  public logout(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      map(() => {}),
      catchError((err) => {
        this.clearSession();
        return of(void 0);
      })
    );
  }

  public isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  public hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return user.permissions.includes(permission) || user.roles.includes('ADMIN');
  }

  public hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return user.roles.includes(roleName);
  }

  public get currentUserValue(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  public patchCurrentUser(patch: Partial<UserInfo>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    this.currentUserSubject.next({ ...current, ...patch });
  }
}
