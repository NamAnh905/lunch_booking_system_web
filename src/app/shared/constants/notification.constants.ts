export const NOTIFICATION_COLLAPSED_LIMIT = 5;

export const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
] as const;

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number]['key'];

export const NOTIFICATION_GROUPS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'earlier', label: 'Trước đó' },
] as const;
