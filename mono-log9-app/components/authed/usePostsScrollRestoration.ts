"use client";

import * as React from "react";

import type { PostsListCondition } from "@/lib/posts/queryKeys";
import {
  getScrollStorageKey,
  restoreScrollPosition,
  saveScrollPosition,
} from "@/lib/posts/scrollRestoration";

export type UsePostsScrollRestorationInput = {
  listCondition: PostsListCondition;
  scrollStorageKey: string;
  listReady: boolean;
  isQueryNormalizing: boolean;
};

export type UsePostsScrollRestorationOutput = {
  isRestoringScroll: boolean;
  saveCurrentScroll: () => void;
  markBeforeRouteChange: () => void;
};

export function usePostsScrollRestoration({
  listCondition,
  scrollStorageKey,
  listReady,
  isQueryNormalizing,
}: UsePostsScrollRestorationInput): UsePostsScrollRestorationOutput {
  const [isRestoringScroll, setIsRestoringScroll] = React.useState(false);

  const restoredScrollKeyRef = React.useRef<string | null>(null);
  const skipCleanupScrollKeyRef = React.useRef<string | null>(null);
  const hasUserScrolledRef = React.useRef(false);
  const isProgrammaticScrollRef = React.useRef(false);
  const isPopstateNavigationRef = React.useRef(false);
  const currentListConditionRef = React.useRef(listCondition);

  React.useLayoutEffect(() => {
    // Keep latest condition before paint so first user action uses the right scroll key.
    currentListConditionRef.current = listCondition;
  }, [listCondition]);

  const markBeforeRouteChange = React.useCallback(() => {
    const currentListCondition = currentListConditionRef.current;
    skipCleanupScrollKeyRef.current = getScrollStorageKey(currentListCondition);
    isPopstateNavigationRef.current = false;
    saveScrollPosition(currentListCondition);
  }, []);

  const saveCurrentScroll = React.useCallback(() => {
    markBeforeRouteChange();
  }, [markBeforeRouteChange]);

  React.useEffect(() => {
    const handlePopState = () => {
      isPopstateNavigationRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  React.useEffect(() => {
    restoredScrollKeyRef.current = null;
    hasUserScrolledRef.current = false;
  }, [scrollStorageKey]);

  React.useEffect(() => {
    if (isQueryNormalizing || !listReady) {
      return;
    }

    if (restoredScrollKeyRef.current === scrollStorageKey) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    setIsRestoringScroll(true);

    return restoreScrollPosition(listCondition, () => {
      restoredScrollKeyRef.current = scrollStorageKey;
      hasUserScrolledRef.current = false;
      setIsRestoringScroll(false);
      window.requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    });
  }, [isQueryNormalizing, listCondition, listReady, scrollStorageKey]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isRestoringScroll || isProgrammaticScrollRef.current) {
        return;
      }

      hasUserScrolledRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isRestoringScroll]);

  React.useEffect(() => {
    return () => {
      if (skipCleanupScrollKeyRef.current === scrollStorageKey) {
        skipCleanupScrollKeyRef.current = null;
        return;
      }

      if (isPopstateNavigationRef.current && window.scrollY === 0) {
        isPopstateNavigationRef.current = false;
        hasUserScrolledRef.current = false;
        return;
      }

      isPopstateNavigationRef.current = false;
      saveScrollPosition(listCondition);
      if (hasUserScrolledRef.current) {
        hasUserScrolledRef.current = false;
      }
    };
  }, [listCondition, scrollStorageKey]);

  return {
    isRestoringScroll,
    saveCurrentScroll,
    markBeforeRouteChange,
  };
}
