export interface SystemConfig {
  id?: number;
  configKey: string;
  configValue?: string;
  description?: string;
  updatedBy?: number;
  updatedAt?: string; // ISO Date string
}

export interface SystemConfigUpdateRequest {
  configKey: string;
  configValue: string;
}
