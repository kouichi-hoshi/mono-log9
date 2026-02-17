import { getStubAuthEnabled, getStubPostsEnabled } from "@/lib/env";

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

  it("enables stub flags only in development when env is true", () => {
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

  it("always disables stub flags in test and production", () => {
    mutableEnv.USE_STUB_AUTH = "true";
    mutableEnv.USE_STUB_POSTS = "true";

    mutableEnv.NODE_ENV = "test";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);

    mutableEnv.NODE_ENV = "production";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);
  });
});
