export interface APIErrorDetail {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIErrorDetail;
  requestId?: string;
}
