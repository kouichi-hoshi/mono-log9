import {
  buildCallbackPathFromQueryString,
  buildCallbackPathFromSearchParams,
  stripStubAuth,
} from "@/lib/auth/callbackUrl";

describe("callbackUrl", () => {
  it("keeps query params and strips stubAuth from searchParams", () => {
    const result = buildCallbackPathFromSearchParams({
      stubAuth: "1",
      view: "note",
      favoriteNote: "",
      foo: "bar",
    });

    expect(result).toBe("/?view=note&favoriteNote=&foo=bar");
  });

  it("returns root path when query is empty", () => {
    expect(buildCallbackPathFromSearchParams(undefined)).toBe("/");
    expect(buildCallbackPathFromQueryString("")).toBe("/");
  });

  it("strips all stubAuth values from query string", () => {
    const result = buildCallbackPathFromQueryString("stubAuth=1&view=memo&stubAuth=1");

    expect(result).toBe("/?view=memo");
  });

  it("handles query strings with leading question mark", () => {
    const result = buildCallbackPathFromQueryString("?view=note&favoriteNote=&stubAuth=1");

    expect(result).toBe("/?view=note&favoriteNote=");
  });

  it("stripStubAuth removes stubAuth key only", () => {
    const params = new URLSearchParams("stubAuth=1&view=memo&foo=bar");

    expect(stripStubAuth(params).toString()).toBe("view=memo&foo=bar");
  });
});
