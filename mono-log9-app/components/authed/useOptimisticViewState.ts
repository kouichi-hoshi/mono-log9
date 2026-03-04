"use client";

import * as React from "react";

type QueryView = "memo" | "note" | "trash";

type OptimisticState = {
  baselineQuery: string;
  optimisticQuery: string;
};

type UseOptimisticViewStateInput = {
  effectiveQueryString: string;
  hasUnsavedEdits: boolean;
  syncTimeoutMs?: number;
  onSyncTimeout?: (view: QueryView) => void;
};

type UseOptimisticViewStateOutput = {
  displayQueryString: string;
  applyOptimisticView: (view: QueryView, optimisticQuery: string) => void;
  rollbackOptimisticView: () => void;
  clearOptimisticViewIfMatched: (queryString: string) => void;
  isOptimisticActive: boolean;
};

function parseView(queryString: string): QueryView | null {
  const view = new URLSearchParams(queryString).get("view");
  if (view === "memo" || view === "note" || view === "trash") {
    return view;
  }
  return null;
}

export function useOptimisticViewState({
  effectiveQueryString,
  hasUnsavedEdits,
  syncTimeoutMs = 1200,
  onSyncTimeout,
}: UseOptimisticViewStateInput): UseOptimisticViewStateOutput {
  const [optimisticState, setOptimisticState] = React.useState<OptimisticState | null>(null);
  const effectiveQueryRef = React.useRef(effectiveQueryString);

  React.useEffect(() => {
    effectiveQueryRef.current = effectiveQueryString;
  }, [effectiveQueryString]);

  React.useEffect(() => {
    setOptimisticState((current) => {
      if (!current) {
        return current;
      }

      if (effectiveQueryString === current.optimisticQuery) {
        return null;
      }

      if (effectiveQueryString !== current.baselineQuery) {
        return null;
      }

      return current;
    });
  }, [effectiveQueryString]);

  React.useEffect(() => {
    if (!optimisticState) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const currentQuery = effectiveQueryRef.current;
      if (currentQuery === optimisticState.optimisticQuery) {
        return;
      }
      if (currentQuery !== optimisticState.baselineQuery) {
        return;
      }

      const view = parseView(optimisticState.optimisticQuery);
      if (view) {
        onSyncTimeout?.(view);
      }
      setOptimisticState(null);
    }, syncTimeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onSyncTimeout, optimisticState, syncTimeoutMs]);

  const applyOptimisticView = React.useCallback(
    (view: QueryView, optimisticQuery: string) => {
      if (hasUnsavedEdits) {
        return;
      }

      const nextView = parseView(optimisticQuery);
      if (nextView !== view) {
        return;
      }

      setOptimisticState({
        baselineQuery: effectiveQueryRef.current,
        optimisticQuery,
      });
    },
    [hasUnsavedEdits]
  );

  const rollbackOptimisticView = React.useCallback(() => {
    setOptimisticState(null);
  }, []);

  const clearOptimisticViewIfMatched = React.useCallback((queryString: string) => {
    setOptimisticState((current) => {
      if (!current) {
        return current;
      }
      if (current.optimisticQuery !== queryString) {
        return current;
      }
      return null;
    });
  }, []);

  const displayQueryString = optimisticState?.optimisticQuery ?? effectiveQueryString;

  return {
    displayQueryString,
    applyOptimisticView,
    rollbackOptimisticView,
    clearOptimisticViewIfMatched,
    isOptimisticActive: optimisticState !== null,
  };
}
