import { act, renderHook } from "@testing-library/react";

import { useInfiniteLoadMore } from "@/components/authed/useInfiniteLoadMore";

type ObserverInstance = {
  callback: IntersectionObserverCallback;
  observed: Set<Element>;
  disconnected: boolean;
};

describe("useInfiniteLoadMore", () => {
  let originalIntersectionObserver: typeof IntersectionObserver;
  let observerInstances: ObserverInstance[];

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver;
    observerInstances = [];

    class TestIntersectionObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin = "";
      readonly thresholds: ReadonlyArray<number> = [];
      private readonly index: number;

      constructor(callback: IntersectionObserverCallback) {
        observerInstances.push({
          callback,
          observed: new Set(),
          disconnected: false,
        });
        this.index = observerInstances.length - 1;
      }

      observe(target: Element) {
        observerInstances[this.index].observed.add(target);
      }

      unobserve(target: Element) {
        observerInstances[this.index].observed.delete(target);
      }

      disconnect() {
        observerInstances[this.index].disconnected = true;
      }

      takeRecords() {
        return [];
      }
    }

    global.IntersectionObserver =
      TestIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  function triggerIntersecting() {
    for (const instance of observerInstances) {
      if (instance.disconnected || instance.observed.size === 0) {
        continue;
      }
      instance.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }
  }

  function triggerNonIntersecting() {
    for (const instance of observerInstances) {
      if (instance.disconnected || instance.observed.size === 0) {
        continue;
      }
      instance.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }
  }

  function setup(overrides?: Partial<Parameters<typeof useInfiniteLoadMore>[0]>) {
    const fetchNextPage = jest.fn(async () => undefined);
    const baseProps: Parameters<typeof useInfiniteLoadMore>[0] = {
      hasNextPage: true,
      isFetchingNextPage: false,
      isRestoringScroll: false,
      hasNextPageError: false,
      isQueryNormalizing: false,
      fetchNextPage,
      ...overrides,
    };

    const rendered = renderHook(
      (props: Parameters<typeof useInfiniteLoadMore>[0]) => useInfiniteLoadMore(props),
      {
        initialProps: baseProps,
      }
    );

    return {
      ...rendered,
      fetchNextPage,
      baseProps,
    };
  }

  function activateObserver(
    rerender: (props: Parameters<typeof useInfiniteLoadMore>[0]) => void,
    baseProps: Parameters<typeof useInfiniteLoadMore>[0]
  ) {
    rerender({
      ...baseProps,
      isQueryNormalizing: !baseProps.isQueryNormalizing,
    });
    rerender(baseProps);
  }

  it("starts observing when conditions allow load more", () => {
    const { result, rerender, baseProps } = setup();
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    expect(observerInstances).toHaveLength(1);
    expect(observerInstances[0].observed.has(sentinel)).toBe(true);
  });

  it("fetches next page when sentinel intersects", () => {
    const { result, rerender, fetchNextPage, baseProps } = setup();
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    triggerIntersecting();

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not start observing when there is no next page", () => {
    const { result, rerender, baseProps } = setup({ hasNextPage: false });
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    expect(observerInstances).toHaveLength(0);
  });

  it("does not fetch when intersection callback is non-intersecting", () => {
    const { result, rerender, fetchNextPage, baseProps } = setup();
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    triggerNonIntersecting();

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it.each([
    {
      title: "while fetching next page",
      overrides: { isFetchingNextPage: true },
    },
    {
      title: "when next page has error",
      overrides: { hasNextPageError: true },
    },
    {
      title: "while restoring scroll",
      overrides: { isRestoringScroll: true },
    },
    {
      title: "while query is normalizing",
      overrides: { isQueryNormalizing: true },
    },
  ])("does not fetch $title", ({ overrides }) => {
    const { result, rerender, fetchNextPage, baseProps } = setup(overrides);
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    triggerIntersecting();

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("disconnects observer on unmount", () => {
    const { result, rerender, unmount, baseProps } = setup();
    const sentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(sentinel);
    });
    activateObserver(rerender, baseProps);

    expect(observerInstances[0].disconnected).toBe(false);

    unmount();

    expect(observerInstances[0].disconnected).toBe(true);
  });

  it("disconnects previous observer and observes new sentinel after ref replacement", () => {
    const { result, rerender, baseProps } = setup();
    const firstSentinel = document.createElement("div");
    const secondSentinel = document.createElement("div");

    act(() => {
      result.current.loadMoreSentinelRef(firstSentinel);
    });
    activateObserver(rerender, baseProps);

    expect(observerInstances).toHaveLength(1);
    expect(observerInstances[0].observed.has(firstSentinel)).toBe(true);

    act(() => {
      result.current.loadMoreSentinelRef(secondSentinel);
    });
    activateObserver(rerender, baseProps);

    expect(observerInstances).toHaveLength(2);
    expect(observerInstances[0].disconnected).toBe(true);
    expect(observerInstances[1].observed.has(secondSentinel)).toBe(true);
    expect(observerInstances[1].observed.has(firstSentinel)).toBe(false);
  });
});
