import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, PageResponse } from '@shared/models';
import { AuditLogResponse } from '@shared/models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  getAuditLogs(page: number, size: number, keyword?: string, action?: string, startDate?: string, endDate?: string): Observable<ApiResponse<PageResponse<AuditLogResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }
    if (action) {
      params = params.set('action', action);
    }
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<ApiResponse<PageResponse<AuditLogResponse>>>(this.apiUrl, { params });
  }

  getActions(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/actions`);
  }
}
