import {
  createStubAuthForbiddenError,
  getStubAuthEnabled,
  getStubPostsEnabled,
  isStubAuthMisconfigured,
  STUB_AUTH_FORBIDDEN_CODE,
  STUB_AUTH_FORBIDDEN_MESSAGE,
} from "@/lib/env";

describe("env guards", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStubAuth = process.env.USE_STUB_AUTH;
  const originalStubPosts = process.env.USE_STUB_POSTS;

  afterEach(() => {
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.USE_STUB_AUTH = originalStubAuth;
    mutableEnv.USE_STUB_POSTS = originalStubPosts;
  });

  it("enables stub flags only in development when env is true (TC-014)", () => {
    mutableEnv.NODE_ENV = "development";
    mutableEnv.USE_STUB_AUTH = "true";
    mutableEnv.USE_STUB_POSTS = "true";

    expect(getStubAuthEnabled()).toBe(true);
    expect(getStubPostsEnabled()).toBe(true);
  });

  it("disables stub flags in development when env is false or unset", () => {
    mutableEnv.NODE_ENV = "development";
    mutableEnv.USE_STUB_AUTH = "false";
    mutableEnv.USE_STUB_POSTS = "";

    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);
  });

  it("always disables stub flags in test and production (TC-013)", () => {
    mutableEnv.USE_STUB_AUTH = "true";
    mutableEnv.USE_STUB_POSTS = "true";

    mutableEnv.NODE_ENV = "test";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);

    mutableEnv.NODE_ENV = "production";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);
  });

  it("detects misconfiguration only when USE_STUB_AUTH is true in test or production", () => {
    mutableEnv.USE_STUB_AUTH = "true";

    mutableEnv.NODE_ENV = "development";
    expect(isStubAuthMisconfigured()).toBe(false);

    mutableEnv.NODE_ENV = "test";
    expect(isStubAuthMisconfigured()).toBe(true);

    mutableEnv.NODE_ENV = "production";
    expect(isStubAuthMisconfigured()).toBe(true);

    mutableEnv.NODE_ENV = "staging";
    expect(isStubAuthMisconfigured()).toBe(false);
  });

  it("treats USE_STUB_AUTH false or unset as non-misconfigured in all environments", () => {
    mutableEnv.NODE_ENV = "test";
    mutableEnv.USE_STUB_AUTH = "false";
    expect(isStubAuthMisconfigured()).toBe(false);

    mutableEnv.NODE_ENV = "production";
    mutableEnv.USE_STUB_AUTH = undefined;
    expect(isStubAuthMisconfigured()).toBe(false);
  });

  it("creates forbidden error contract for non-HTTP boundary", () => {
    const error = createStubAuthForbiddenError();
    expect(error.code).toBe(STUB_AUTH_FORBIDDEN_CODE);
    expect(error.message).toBe(STUB_AUTH_FORBIDDEN_MESSAGE);
  });
});
