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
