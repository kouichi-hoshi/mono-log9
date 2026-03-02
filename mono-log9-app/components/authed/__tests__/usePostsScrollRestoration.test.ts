import { act, renderHook } from "@testing-library/react";

import { usePostsScrollRestoration } from "@/components/authed/usePostsScrollRestoration";
import { getScrollStorageKey } from "@/lib/posts/scrollRestoration";
import type { PostsListCondition } from "@/lib/posts/queryKeys";

jest.mock("@/lib/posts/scrollRestoration", () => {
  const actual = jest.requireActual<typeof import("@/lib/posts/scrollRestoration")>(
    "@/lib/posts/scrollRestoration"
  );
  return {
    ...actual,
    saveScrollPosition: jest.fn(),
    restoreScrollPosition: jest.fn(),
  };
});

type ScrollRestorationModule = {
  saveScrollPosition: jest.Mock;
  restoreScrollPosition: jest.Mock;
};

function getScrollRestorationMock() {
  return jest.requireMock("@/lib/posts/scrollRestoration") as ScrollRestorationModule;
}

const memoListCondition: PostsListCondition = {
  view: "memo",
  favoriteOnly: false,
};

describe("usePostsScrollRestoration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 320,
    });
    getScrollRestorationMock().restoreScrollPosition.mockReturnValue(jest.fn());
  });

  it("restores scroll only once for the same list condition", () => {
    getScrollRestorationMock().restoreScrollPosition.mockImplementation(
      (_condition: PostsListCondition, onComplete?: () => void) => {
        onComplete?.();
        return jest.fn();
      }
    );

    const { rerender } = renderHook(
      ({ listReady }) =>
        usePostsScrollRestoration({
          listCondition: memoListCondition,
          scrollStorageKey: getScrollStorageKey(memoListCondition),
          listReady,
          isQueryNormalizing: false,
        }),
      {
        initialProps: {
          listReady: true,
        },
      }
    );

    expect(getScrollRestorationMock().restoreScrollPosition).toHaveBeenCalledTimes(1);

    rerender({ listReady: true });
    expect(getScrollRestorationMock().restoreScrollPosition).toHaveBeenCalledTimes(1);
  });

  it("skips restore while query is normalizing and restores after normalization", () => {
    const { rerender } = renderHook(
      ({ isQueryNormalizing }) =>
        usePostsScrollRestoration({
          listCondition: memoListCondition,
          scrollStorageKey: getScrollStorageKey(memoListCondition),
          listReady: true,
          isQueryNormalizing,
        }),
      {
        initialProps: {
          isQueryNormalizing: true,
        },
      }
    );

    expect(getScrollRestorationMock().restoreScrollPosition).not.toHaveBeenCalled();

    rerender({ isQueryNormalizing: false });
    expect(getScrollRestorationMock().restoreScrollPosition).toHaveBeenCalledTimes(1);
  });

  it("marks route change and skips duplicate cleanup save", () => {
    const { result, unmount } = renderHook(() =>
      usePostsScrollRestoration({
        listCondition: memoListCondition,
        scrollStorageKey: getScrollStorageKey(memoListCondition),
        listReady: false,
        isQueryNormalizing: false,
      })
    );

    act(() => {
      result.current.markBeforeRouteChange();
    });

    expect(getScrollRestorationMock().saveScrollPosition).toHaveBeenCalledTimes(1);

    unmount();

    expect(getScrollRestorationMock().saveScrollPosition).toHaveBeenCalledTimes(1);
  });

  it("does not overwrite saved scroll with 0 during popstate cleanup", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });

    const { unmount } = renderHook(() =>
      usePostsScrollRestoration({
        listCondition: memoListCondition,
        scrollStorageKey: getScrollStorageKey(memoListCondition),
        listReady: false,
        isQueryNormalizing: false,
      })
    );

    window.dispatchEvent(new PopStateEvent("popstate"));
    unmount();

    expect(getScrollRestorationMock().saveScrollPosition).not.toHaveBeenCalled();
  });

  it("saves scroll on cleanup in normal navigation", () => {
    const { unmount } = renderHook(() =>
      usePostsScrollRestoration({
        listCondition: memoListCondition,
        scrollStorageKey: getScrollStorageKey(memoListCondition),
        listReady: false,
        isQueryNormalizing: false,
      })
    );

    unmount();

    expect(getScrollRestorationMock().saveScrollPosition).toHaveBeenCalledTimes(1);
    expect(getScrollRestorationMock().saveScrollPosition).toHaveBeenCalledWith(memoListCondition);
  });
});
