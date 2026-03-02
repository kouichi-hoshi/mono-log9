"use client";

import * as React from "react";

export type UseInfiniteLoadMoreInput = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRestoringScroll: boolean;
  hasNextPageError: boolean;
  isQueryNormalizing: boolean;
  fetchNextPage: () => Promise<unknown>;
};

export type UseInfiniteLoadMoreOutput = {
  loadMoreSentinelRef: (element: HTMLDivElement | null) => void;
};

export function useInfiniteLoadMore({
  hasNextPage,
  isFetchingNextPage,
  isRestoringScroll,
  hasNextPageError,
  isQueryNormalizing,
  fetchNextPage,
}: UseInfiniteLoadMoreInput): UseInfiniteLoadMoreOutput {
  const loadMoreSentinelElementRef = React.useRef<HTMLDivElement | null>(null);

  const loadMoreSentinelRef = React.useCallback((element: HTMLDivElement | null) => {
    loadMoreSentinelElementRef.current = element;
  }, []);

  React.useEffect(() => {
    const target = loadMoreSentinelElementRef.current;

    if (
      !target ||
      !hasNextPage ||
      isFetchingNextPage ||
      isRestoringScroll ||
      hasNextPageError ||
      isQueryNormalizing
    ) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const shouldLoad = entries.some((entry) => entry.isIntersecting);
      if (
        !shouldLoad ||
        isFetchingNextPage ||
        !hasNextPage ||
        isRestoringScroll ||
        hasNextPageError ||
        isQueryNormalizing
      ) {
        return;
      }

      void fetchNextPage();
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    fetchNextPage,
    hasNextPage,
    hasNextPageError,
    isFetchingNextPage,
    isQueryNormalizing,
    isRestoringScroll,
  ]);

  return {
    loadMoreSentinelRef,
  };
}
