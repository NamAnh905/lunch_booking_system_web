import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleResponse, RoleCreateRequest, RoleUpdateRequest, PageResponse } from '@shared/models';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/admin/roles`;

  constructor(private http: HttpClient) { }

  query(query: { keyword?: string }): Observable<PageResponse<RoleResponse>> {
    let params: any = {};
    if (query.keyword) {
      params.keyword = query.keyword;
    }
    return this.http.get<PageResponse<RoleResponse>>(this.apiUrl, { params });
  }

  add(form: RoleCreateRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, form);
  }

  edit(id: number | string, form: RoleUpdateRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, form);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
