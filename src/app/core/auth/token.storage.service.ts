import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly LOGGED_IN_KEY = 'lunch_order_logged_in';

  public setLoggedIn(status: boolean): void {
    if (status) {
      localStorage.setItem(this.LOGGED_IN_KEY, 'true');
    } else {
      localStorage.removeItem(this.LOGGED_IN_KEY);
    }
  }

  public isLoggedIn(): boolean {
    return localStorage.getItem(this.LOGGED_IN_KEY) === 'true';
  }
}
