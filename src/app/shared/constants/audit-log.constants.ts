export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_PRICE: 'Thêm giá',
  UPDATE_PRICE: 'Sửa giá',
  DELETE_PRICE: 'Xóa giá',
};

export const AUDIT_ACTION_KINDS: Record<string, 'create' | 'update' | 'delete'> = {
  CREATE_PRICE: 'create',
  UPDATE_PRICE: 'update',
  DELETE_PRICE: 'delete',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Price: 'Giá',
};
