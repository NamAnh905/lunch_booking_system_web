import { ApiResponse } from './base.model';


export interface TokenResponse {
  token?: string;
  authenticated: boolean;
}

export interface UserClaims {
  sub: string;      // username
  userId: number;
  fullName?: string;
  scope: string;    // space-separated roles and permissions (e.g. "ROLE_USER VIEW_REPORTS")
  exp: number;      // expiration timestamp (in seconds)
  refreshExpiry?: number;
}

export interface UserInfo {
  username: string;
  userId: number;
  fullName?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LogoutRequest {
  token: string;
}

export interface RefreshRequest {
  token: string;
}

export interface IntrospectRequest {
  token: string;
}

export interface IntrospectResponse {
  valid: boolean;
}
