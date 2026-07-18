import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models';
import { UserResponse, ProfileUpdateRequest, ChangePasswordRequest } from '@shared/models/user.model';
import { skipErrorToast } from '@core/interceptors/http-context.tokens';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth/me`;

  getMe(): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(this.apiUrl);
  }

  updateMe(body: ProfileUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(this.apiUrl, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, body, {
      context: skipErrorToast(),
    });
  }
}
