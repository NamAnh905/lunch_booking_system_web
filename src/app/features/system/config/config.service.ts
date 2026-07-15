import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@shared/models';
import { SystemConfig, SystemConfigUpdateRequest } from '@shared/models/system-config.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/system-config`;

  getAll(): Observable<ApiResponse<SystemConfig[]>> {
    return this.http.get<ApiResponse<SystemConfig[]>>(this.apiUrl);
  }

  updateAll(requests: SystemConfigUpdateRequest[]): Observable<ApiResponse<SystemConfig[]>> {
    return this.http.put<ApiResponse<SystemConfig[]>>(this.apiUrl, requests);
  }
}
