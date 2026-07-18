export type BackendDate = string | number[] | null | undefined;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function parseBackendDate(value: BackendDate): Date | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    const [y, m = 1, d = 1, hh = 0, mm = 0, ss = 0] = value;
    return new Date(y, m - 1, d, hh, mm, ss);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Chủ Nhật
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export interface WeekRange {
  monday: Date;
  start: string;
  end: string;
}

export function getWeekRange(base: Date, workingDays = 5): WeekRange {
  const monday = getMonday(base);
  const end = new Date(monday);
  end.setDate(monday.getDate() + (workingDays - 1));
  return { monday, start: toIsoDate(monday), end: toIsoDate(end) };
}
