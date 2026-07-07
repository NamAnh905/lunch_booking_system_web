export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
}

export interface BaseEntity {
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}

export interface PageQuery {
  page: number;
  size: number;
  keyword?: string;
  [key: string]: any;
}

