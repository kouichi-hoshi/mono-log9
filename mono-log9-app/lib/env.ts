export function getStubAuthEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return process.env.USE_STUB_AUTH === "true";
}

export function getStubPostsEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return process.env.USE_STUB_POSTS === "true";
}

export const STUB_AUTH_FORBIDDEN_CODE = "FORBIDDEN";
export const STUB_AUTH_FORBIDDEN_MESSAGE = "stub auth is disabled in this environment";

export type StubAuthForbiddenError = Error & {
  code: typeof STUB_AUTH_FORBIDDEN_CODE;
};

export function isStubAuthMisconfigured(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  return process.env.USE_STUB_AUTH === "true" && (nodeEnv === "test" || nodeEnv === "production");
}

export function createStubAuthForbiddenError(): StubAuthForbiddenError {
  const error = new Error(STUB_AUTH_FORBIDDEN_MESSAGE) as StubAuthForbiddenError;
  error.code = STUB_AUTH_FORBIDDEN_CODE;
  return error;
}
