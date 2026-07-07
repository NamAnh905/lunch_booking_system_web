import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, ApiResponse } from '@shared/models';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/users`;

  query(query: any, page: number, size: number): Observable<ApiResponse<PageResponse<UserResponse>>> {
    let params = new HttpParams()
      .set('page', (page + 1).toString()); // Backend seems to be 1-indexed, let's verify but normally spring page is 0. Wait, UserController.java has defaultValue = "1". I will send page+1 since base-crud sends 0-indexed page!
      // I will adjust based on how spring handles page param.
    
    // Add other query params if any
    if (query.keyword) {
      params = params.set('keyword', query.keyword);
    }

    return this.http.get<ApiResponse<PageResponse<UserResponse>>>(this.apiUrl, { params });
  }

  add(form: UserCreateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.post<ApiResponse<UserResponse>>(this.apiUrl, form);
  }

  edit(id: number | string, form: UserUpdateRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number | string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
