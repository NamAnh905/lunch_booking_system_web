export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

const VIETNAMESE_COLLATOR = new Intl.Collator('vi', { numeric: true });

export function compareText(a: unknown, b: unknown): number {
  return VIETNAMESE_COLLATOR.compare(a == null ? '' : String(a), b == null ? '' : String(b));
}

export function sortByText<T>(items: T[], sort: SortState | null): T[] {
  if (!sort) {
    return items;
  }

  const factor = sort.direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => factor * compareText((a as any)[sort.field], (b as any)[sort.field]));
}
