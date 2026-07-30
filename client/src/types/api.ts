/** Transport-level envelopes shared by every REST route. */

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Field-level detail for validation failures. */
    details?: Array<{ path: string; message: string }>;
  };
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });

export const fail = (
  code: string,
  message: string,
  details?: ApiError['error']['details'],
): ApiError => ({
  ok: false,
  error: details ? { code, message, details } : { code, message },
});
