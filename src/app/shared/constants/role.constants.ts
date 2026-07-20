export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];
