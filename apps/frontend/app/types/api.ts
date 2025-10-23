export interface ApiMeta {
  path: string;
  method: string;
  statusCode?: number;
  timestamp: string;
  duration: number;
  version?: string;
  request_id?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
  };
}

export interface ApiError {
  code: string;
  type: string;
  message: string;
  details?: any[];
}

export interface EnhancedApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

// Type helpers for better dev experience
export type SuccessApiResponse<T = any> = EnhancedApiResponse<T> & {
  success: true;
  data: T;
  error?: never;
};

export type ErrorApiResponse = EnhancedApiResponse<never> & {
  success: false;
  data?: never;
  error: ApiError;
};

export type ApiResponse<T = any> = SuccessApiResponse<T> | ErrorApiResponse;
