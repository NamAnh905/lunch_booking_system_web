import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@shared/models';
import { CUTOFF_TIME } from '@shared/constants/business.constants';
import { AuthService } from '@core/auth/auth.service';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

interface BusinessConfigApiResponse {
  cutOffTime: string;
  ticketLockTime: string;
}

function parseTime(value: string, fallback: TimeOfDay): TimeOfDay {
  const [hour, minute] = (value || '').split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? { hour, minute } : fallback;
}

/** `"14h45"` — định dạng hiển thị dùng trong các thông báo tiếng Việt hiện có. */
export function formatVnTime(time: TimeOfDay): string {
  return `${time.hour}h${String(time.minute).padStart(2, '0')}`;
}

/**
 * Nguồn sự thật cho các mốc giờ chốt đơn / khóa chợ pass vé ở phía client,
 * thay cho hằng số `CUTOFF_TIME` hardcode. Tự tải lại mỗi khi có phiên đăng
 * nhập mới (login hoặc refresh token lúc khởi động app); giữ giá trị mặc định
 * trùng với fallback phía backend cho tới khi tải xong hoặc nếu API lỗi.
 */
@Injectable({ providedIn: 'root' })
export class BusinessConfigService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/business-config`;

  /** Giờ chốt đặt/hủy suất ăn và giờ mở cửa sổ pass vé (cùng key CUT_OFF_TIME). */
  cutOffTime: TimeOfDay = { ...CUTOFF_TIME.ORDER };
  exchangeLockTime: TimeOfDay = { ...CUTOFF_TIME.EXCHANGE_END };

  constructor() {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.reload();
      }
    });
  }

  private reload(): void {
    this.http.get<ApiResponse<BusinessConfigApiResponse>>(this.apiUrl).subscribe({
      next: (res) => {
        const data = res.result;
        if (!data) return;
        this.cutOffTime = parseTime(data.cutOffTime, this.cutOffTime);
        this.exchangeLockTime = parseTime(data.ticketLockTime, this.exchangeLockTime);
      },
      error: () => {
        // Giữ nguyên giá trị mặc định/hiện tại nếu API lỗi.
      }
    });
  }
}
