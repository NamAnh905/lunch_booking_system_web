export function formatMoneyShort(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0k';
  }
  return `${Number(value) / 1000}k`;
}
