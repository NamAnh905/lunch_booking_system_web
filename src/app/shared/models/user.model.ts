import { BaseEntity } from './base.model';
import { Department } from './department.model';
import { Role } from './role.model';

export interface User extends BaseEntity {
  id?: number;
  username: string;
  fullName?: string;
  password?: string;
  department?: Department;
  isActive: boolean;
  roles?: Role[];
}

export interface UserCreateRequest {
  username: string;
  password?: string;
  fullName: string;
  department: string;
  roles?: string[];
}

export interface UserUpdateRequest {
  fullName: string;
  department: string;
  isActive: boolean;
  password?: string;
  roles?: string[];
}

export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  department: string;
  isActive: boolean;
  roles: string[];
}

export interface UserAssignRolesRequest {
  roleCodes: string[];
}
