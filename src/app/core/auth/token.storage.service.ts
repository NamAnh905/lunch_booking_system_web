import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly LOGGED_IN_KEY = 'lunch_order_logged_in';

  public setLoggedIn(status: boolean, rememberMe = false): void {
    localStorage.removeItem(this.LOGGED_IN_KEY);
    sessionStorage.removeItem(this.LOGGED_IN_KEY);
    if (status) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(this.LOGGED_IN_KEY, 'true');
    }
  }

  public isLoggedIn(): boolean {
    return (
      localStorage.getItem(this.LOGGED_IN_KEY) === 'true' ||
      sessionStorage.getItem(this.LOGGED_IN_KEY) === 'true'
    );
  }
}
