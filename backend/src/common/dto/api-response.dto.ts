export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorDetail {
  message: string;
  code?: string;
  details?: Record<string, any> | string[];
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
