export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_PRICE: 'Thêm giá',
  UPDATE_PRICE: 'Sửa giá',
  DELETE_PRICE: 'Xóa giá',
  CREATE_USER: 'Thêm người dùng',
  UPDATE_USER: 'Sửa người dùng',
  DELETE_USER: 'Khóa người dùng',
  ASSIGN_USER_ROLES: 'Gán vai trò cho người dùng',
  CREATE_ROLE: 'Thêm vai trò',
  UPDATE_ROLE: 'Sửa vai trò',
  DELETE_ROLE: 'Xóa vai trò',
  ASSIGN_ROLE_PERMISSIONS: 'Gán quyền cho vai trò',
  CREATE_PERMISSION: 'Thêm quyền',
  UPDATE_PERMISSION: 'Sửa quyền',
  DELETE_PERMISSION: 'Xóa quyền',
};

export const AUDIT_ACTION_KINDS: Record<string, 'create' | 'update' | 'delete'> = {
  CREATE_PRICE: 'create',
  UPDATE_PRICE: 'update',
  DELETE_PRICE: 'delete',
  CREATE_USER: 'create',
  UPDATE_USER: 'update',
  DELETE_USER: 'delete',
  ASSIGN_USER_ROLES: 'update',
  CREATE_ROLE: 'create',
  UPDATE_ROLE: 'update',
  DELETE_ROLE: 'delete',
  ASSIGN_ROLE_PERMISSIONS: 'update',
  CREATE_PERMISSION: 'create',
  UPDATE_PERMISSION: 'update',
  DELETE_PERMISSION: 'delete',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Price: 'Giá',
  User: 'Người dùng',
  Role: 'Vai trò',
  Permission: 'Quyền',
};
