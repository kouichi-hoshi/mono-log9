export type PostErrorCode =
  | "FORBIDDEN"
  | "NOT_IMPLEMENTED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INVALID_CURSOR";

const STATUS_BY_CODE: Record<PostErrorCode, number> = {
  FORBIDDEN: 403,
  NOT_IMPLEMENTED: 501,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INVALID_CURSOR: 400,
};

export class PostRepositoryError extends Error {
  readonly code: PostErrorCode;
  readonly status: number;

  constructor(code: PostErrorCode, message: string) {
    super(message);
    this.name = "PostRepositoryError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export function isPostRepositoryError(error: unknown): error is PostRepositoryError {
  return error instanceof PostRepositoryError;
}
