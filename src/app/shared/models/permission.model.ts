import { BaseEntity } from './base.model';

export interface Permission extends BaseEntity {
  id: number;
  action: string;
  description: string;
}

export interface PermissionCreateRequest {
  action: string;
  description: string;
}

export interface PermissionUpdateRequest {
  action: string;
  description: string;
}
