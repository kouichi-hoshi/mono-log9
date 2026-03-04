"use client";

import * as React from "react";

import { toRootPath } from "@/lib/authedQueryState";

export type PendingAction =
  | {
      type: "query";
      nextQuery: string;
      method: "push" | "replace";
    }
  | {
      type: "openMemoEdit";
      postId: string;
      initialValue: string;
    }
  | {
      type: "closeMemoEdit";
    };

type RouterLike = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

type UseGuardedQueryNavigationOptions = {
  queryString: string;
  hasUnsavedEdits: boolean;
  router: RouterLike;
  saveCurrentScroll: () => void;
  onOpenMemoEdit: (postId: string, initialValue: string) => void;
  onCloseMemoEdit: () => void;
  onDiscardEdits: () => void;
};

type UseGuardedQueryNavigationResult = {
  effectiveQueryString: string;
  committedQueryString: string;
  isDiscardDialogOpen: boolean;
  pendingAction: PendingAction | null;
  runOrConfirm: (action: PendingAction) => void;
  executeAction: (action: PendingAction) => void;
  syncCommittedQuery: (nextQuery: string) => void;
  handleDiscardDialogOpenChange: (open: boolean) => void;
  handleDiscardAndContinue: () => void;
};

export function useGuardedQueryNavigation({
  queryString,
  hasUnsavedEdits,
  router,
  saveCurrentScroll,
  onOpenMemoEdit,
  onCloseMemoEdit,
  onDiscardEdits,
}: UseGuardedQueryNavigationOptions): UseGuardedQueryNavigationResult {
  const committedQueryRef = React.useRef(queryString);
  const previousQueryRef = React.useRef(queryString);
  const isPopstateNavigationRef = React.useRef(false);
  const [committedQueryString, setCommittedQueryString] = React.useState(queryString);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);

  const syncCommittedQuery = React.useCallback((nextQuery: string) => {
    committedQueryRef.current = nextQuery;
    setCommittedQueryString(nextQuery);
  }, []);

  const executeAction = React.useCallback(
    (action: PendingAction) => {
      switch (action.type) {
        case "query": {
          try {
            saveCurrentScroll();
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("saveCurrentScroll failed, continue navigation", error);
            }
            // Scroll persistence failure must not block navigation.
          }
          syncCommittedQuery(action.nextQuery);
          if (action.method === "push") {
            router.push(toRootPath(action.nextQuery));
            return;
          }
          router.replace(toRootPath(action.nextQuery));
          return;
        }
        case "openMemoEdit": {
          onOpenMemoEdit(action.postId, action.initialValue);
          return;
        }
        case "closeMemoEdit": {
          onCloseMemoEdit();
          return;
        }
      }
    },
    [onCloseMemoEdit, onOpenMemoEdit, router, saveCurrentScroll, syncCommittedQuery]
  );

  const runOrConfirm = React.useCallback(
    (action: PendingAction) => {
      if (hasUnsavedEdits) {
        setPendingAction(action);
        setIsDiscardDialogOpen(true);
        return;
      }

      executeAction(action);
    },
    [executeAction, hasUnsavedEdits]
  );

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
    const previousQuery = previousQueryRef.current;
    if (previousQuery === queryString) {
      return;
    }
    previousQueryRef.current = queryString;

    const isPopstateNavigation = isPopstateNavigationRef.current;
    isPopstateNavigationRef.current = false;

    if (!hasUnsavedEdits) {
      syncCommittedQuery(queryString);
      return;
    }

    const committedQuery = committedQueryRef.current;
    if (queryString === committedQuery) {
      return;
    }

    setPendingAction({
      type: "query",
      nextQuery: queryString,
      method: "replace",
    });
    setIsDiscardDialogOpen(true);

    if (isPopstateNavigation || queryString !== committedQuery) {
      router.replace(toRootPath(committedQuery));
    }
  }, [hasUnsavedEdits, queryString, router, syncCommittedQuery]);

  const handleDiscardDialogOpenChange = React.useCallback((open: boolean) => {
    setIsDiscardDialogOpen(open);
    if (!open) {
      setPendingAction(null);
    }
  }, []);

  const handleDiscardAndContinue = React.useCallback(() => {
    const action = pendingAction;
    setIsDiscardDialogOpen(false);
    setPendingAction(null);
    onDiscardEdits();
    if (action) {
      executeAction(action);
    }
  }, [executeAction, onDiscardEdits, pendingAction]);

  const effectiveQueryString =
    hasUnsavedEdits && queryString !== committedQueryString ? committedQueryString : queryString;

  return {
    effectiveQueryString,
    committedQueryString,
    isDiscardDialogOpen,
    pendingAction,
    runOrConfirm,
    executeAction,
    syncCommittedQuery,
    handleDiscardDialogOpenChange,
    handleDiscardAndContinue,
  };
}
