export const MENU_IMAGE_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_SIZE_LABEL: '10MB',
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as readonly string[],
  ACCEPT_ATTR: 'image/jpeg,image/png,image/webp',
  ACCEPTED_TYPES_LABEL: 'JPG, PNG hoặc WebP',
} as const;
