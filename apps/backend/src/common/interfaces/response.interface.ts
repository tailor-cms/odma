export interface StructuredResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: any[];
  };
  meta: {
    statusCode?: number;
    path: string;
    method: string;
    timestamp: string;
    duration: number;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      has_next: boolean;
    };
  };
}

// Type helpers for better dev experience
export type SuccessResponse<T = any> = StructuredResponse<T> & {
  success: true;
  data: T;
  error?: never;
};

export type ErrorResponse = StructuredResponse<never> & {
  success: false;
  data?: never;
  error: {
    type: string;
    message: string;
    details?: any[];
  };
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
