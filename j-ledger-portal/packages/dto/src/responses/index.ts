export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta: {
    traceId?: string;
    timestamp: string;
    path?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string | number;
    message: string;
    details?: any;
  };
  meta: {
    traceId?: string;
    timestamp: string;
    path?: string;
  };
}
