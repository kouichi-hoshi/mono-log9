import { getStubAuthEnabled, getStubPostsEnabled } from "@/lib/env";

describe("env guards", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStubAuth = process.env.USE_STUB_AUTH;
  const originalStubPosts = process.env.USE_STUB_POSTS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.USE_STUB_AUTH = originalStubAuth;
    process.env.USE_STUB_POSTS = originalStubPosts;
  });

  it("enables stub flags only in development when env is true", () => {
    process.env.NODE_ENV = "development";
    process.env.USE_STUB_AUTH = "true";
    process.env.USE_STUB_POSTS = "true";

    expect(getStubAuthEnabled()).toBe(true);
    expect(getStubPostsEnabled()).toBe(true);
  });

  it("disables stub flags in development when env is false or unset", () => {
    process.env.NODE_ENV = "development";
    process.env.USE_STUB_AUTH = "false";
    process.env.USE_STUB_POSTS = "";

    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);
  });

  it("always disables stub flags in test and production", () => {
    process.env.USE_STUB_AUTH = "true";
    process.env.USE_STUB_POSTS = "true";

    process.env.NODE_ENV = "test";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);

    process.env.NODE_ENV = "production";
    expect(getStubAuthEnabled()).toBe(false);
    expect(getStubPostsEnabled()).toBe(false);
  });
});
