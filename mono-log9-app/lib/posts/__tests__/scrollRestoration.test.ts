import {
  getScrollStorageKey,
  readScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
} from "@/lib/posts/scrollRestoration";

describe("scrollRestoration", () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 320,
    });
  });

  it("builds storage key by list condition", () => {
    expect(getScrollStorageKey({ view: "memo", favoriteOnly: false, actorScope: "stub" })).toBe(
      "mono-log:scroll:v1:stub:memo:0"
    );
    expect(getScrollStorageKey({ view: "memo", favoriteOnly: true, actorScope: "stub" })).toBe(
      "mono-log:scroll:v1:stub:memo:1"
    );
  });

  it("saves and reads scroll position", () => {
    const condition = { view: "note" as const, favoriteOnly: false, actorScope: "stub" };
    saveScrollPosition(condition);

    expect(readScrollPosition(condition)).toBe(320);
  });

  it("restores scroll position using requestAnimationFrame", () => {
    const condition = { view: "memo" as const, favoriteOnly: false, actorScope: "stub" };
    sessionStorage.setItem(getScrollStorageKey(condition), "120");
    const rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const scrollToMock = jest.spyOn(window, "scrollTo");

    restoreScrollPosition(condition);

    expect(scrollToMock).toHaveBeenCalledWith({ top: 120, left: 0, behavior: "auto" });
    rafSpy.mockRestore();
  });
});
