export const PAGE_ELLIPSIS = '...';

export type PageItem = number | typeof PAGE_ELLIPSIS;

export function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  const total = Math.max(totalPages, 1);
  const current = Math.min(Math.max(currentPage, 1), total);

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 3) {
    start = 2;
    end = 3;
  } else if (current >= total - 2) {
    start = total - 2;
    end = total - 1;
  }

  const items: PageItem[] = [1];

  if (start > 2) {
    items.push(PAGE_ELLIPSIS);
  }

  for (let page = start; page <= end; page++) {
    items.push(page);
  }

  if (end < total - 1) {
    items.push(PAGE_ELLIPSIS);
  }

  items.push(total);

  return items;
}
