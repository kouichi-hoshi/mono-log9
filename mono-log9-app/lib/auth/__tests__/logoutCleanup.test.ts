import { QueryClient } from "@tanstack/react-query";

import {
  cleanupAfterLogout,
  clearPostsQueryCache,
  clearScrollRestorationStorage,
} from "@/lib/auth/logoutCleanup";

describe("logoutCleanup", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("removes posts query cache", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    queryClient.setQueryData(["posts", { view: "memo", favoriteOnly: false }], {
      items: [],
    });
    queryClient.setQueryData(["other", "data"], { ok: true });

    clearPostsQueryCache(queryClient);

    expect(queryClient.getQueryData(["posts", { view: "memo", favoriteOnly: false }])).toBeUndefined();
    expect(queryClient.getQueryData(["other", "data"])).toEqual({ ok: true });
  });

  it("removes only scroll restoration keys", () => {
    sessionStorage.setItem("mono-log:scroll:v1:memo:0", "100");
    sessionStorage.setItem("mono-log:scroll:v1:note:1", "300");
    sessionStorage.setItem("mono-log:relogin-draft:v1", "keep");

    clearScrollRestorationStorage();

    expect(sessionStorage.getItem("mono-log:scroll:v1:memo:0")).toBeNull();
    expect(sessionStorage.getItem("mono-log:scroll:v1:note:1")).toBeNull();
    expect(sessionStorage.getItem("mono-log:relogin-draft:v1")).toBe("keep");
  });

  it("cleanupAfterLogout removes posts cache and scroll keys together", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["posts", { view: "memo", favoriteOnly: false }], { items: [] });
    sessionStorage.setItem("mono-log:scroll:v1:memo:0", "120");

    cleanupAfterLogout(queryClient);

    expect(queryClient.getQueryData(["posts", { view: "memo", favoriteOnly: false }])).toBeUndefined();
    expect(sessionStorage.getItem("mono-log:scroll:v1:memo:0")).toBeNull();
  });
});
