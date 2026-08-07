import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse } from '@shared/models';
import { CUTOFF_TIME, MAX_ADVANCE_MONTHS } from '@shared/constants/business.constants';
import { AuthService } from '@core/auth/auth.service';
import { endOfMonthsAhead, isWeekend, parseIsoDate, toIsoDate } from '@shared/utils/date.util';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

interface BusinessConfigApiResponse {
  cutOffTime: string;
  ticketLockTime: string;
  holidays: string[];
  maxOrderableDate: string;
}

function parseTime(value: string, fallback: TimeOfDay): TimeOfDay {
  const [hour, minute] = (value || '').split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? { hour, minute } : fallback;
}

export function formatVnTime(time: TimeOfDay): string {
  return `${time.hour}h${String(time.minute).padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class BusinessConfigService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/business-config`;

  cutOffTime: TimeOfDay = { ...CUTOFF_TIME.ORDER };
  exchangeLockTime: TimeOfDay = { ...CUTOFF_TIME.EXCHANGE_END };
  holidays: Set<string> = new Set();
  maxOrderableDate: string = toIsoDate(endOfMonthsAhead(MAX_ADVANCE_MONTHS));

  constructor() {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.reload();
      }
    });
  }

  isPastCutOff(now: Date = new Date()): boolean {
    const { hour, minute } = this.cutOffTime;
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  }

  earliestOrderableDate(now: Date = new Date()): Date {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() + (this.isPastCutOff(now) ? 2 : 1));
    return date;
  }

  isOrderable(date: string): boolean {
    return date >= toIsoDate(this.earliestOrderableDate())
      && date <= this.maxOrderableDate
      && !this.holidays.has(date)
      && !isWeekend(parseIsoDate(date));
  }

  private reload(): void {
    this.http.get<ApiResponse<BusinessConfigApiResponse>>(this.apiUrl).subscribe({
      next: (res) => {
        const data = res.result;
        if (!data) return;
        this.cutOffTime = parseTime(data.cutOffTime, this.cutOffTime);
        this.exchangeLockTime = parseTime(data.ticketLockTime, this.exchangeLockTime);
        this.holidays = new Set(data.holidays ?? []);
        if (data.maxOrderableDate) {
          this.maxOrderableDate = data.maxOrderableDate;
        }
      },
      error: () => {}
    });
  }
}
