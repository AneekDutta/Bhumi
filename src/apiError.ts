/**
 * Typed API error taxonomy.
 *
 * Handlers map transport and HTTP failures onto a small closed set of codes so
 * the UI can show a safe, human-readable message. Raw server text is kept in
 * `detail` for development logging only — it is never rendered.
 */

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN_ERROR";

/** Safe, user-facing copy. No stack traces, URLs, tokens or server internals. */
const USER_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to do this.",
  NOT_FOUND: "That record could not be found.",
  CONFLICT: "This record was changed by someone else. Reload and try again.",
  VALIDATION_ERROR: "Some details are missing or invalid. Please check and try again.",
  SERVER_ERROR: "The server could not complete this request. Please try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
  CONFIG_ERROR: "The app is not configured to reach the server.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

export function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  /** Raw server detail — for logs only, never shown to users. */
  readonly detail?: string;

  constructor(code: ApiErrorCode, opts: { status?: number; detail?: string } = {}) {
    super(USER_MESSAGES[code]);
    this.name = "ApiError";
    this.code = code;
    this.status = opts.status;
    this.detail = opts.detail;
  }

  /** Message safe to render in the UI. */
  get userMessage(): string {
    return USER_MESSAGES[this.code];
  }

  static fromStatus(status: number, detail?: string): ApiError {
    return new ApiError(codeForStatus(status), { status, detail });
  }

  /** Normalise anything thrown into an ApiError. */
  static from(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    const detail = err instanceof Error ? err.message : String(err);
    // fetch() rejects with a TypeError when the request never reached a server.
    if (err instanceof TypeError) return new ApiError("NETWORK_ERROR", { detail });
    return new ApiError("UNKNOWN_ERROR", { detail });
  }
}

/** Safe message for any thrown value. */
export function userMessage(err: unknown): string {
  return ApiError.from(err).userMessage;
}
