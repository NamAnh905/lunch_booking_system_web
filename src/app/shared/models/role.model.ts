export interface Role {
  id?: number;
  code: string;
  name: string;
  description?: string;
  permissions?: any[];
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  permissions?: any[];
}

export interface RoleCreateRequest {
  code: string;
  name: string;
  description: string;
  permissions?: string[];
}

export interface RoleUpdateRequest {
  name: string;
  description: string;
  permissions?: string[];
}

export interface RoleAssignPermissionsRequest {
  permissionCodes: string[];
}
