import { BaseEntity } from './base.model';

export interface Department extends BaseEntity {
  id?: number;
  code: string;
  name: string;
  userCount?: number;
}

export interface DepartmentCreateRequest {
  code: string;
  name: string;
}

export interface DepartmentUpdateRequest {
  code?: string;
  name: string;
}

export interface DepartmentResponse {
  id: number;
  code: string;
  name: string;
  userCount?: number;
}
