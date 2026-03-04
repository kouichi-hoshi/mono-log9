import { act, renderHook } from "@testing-library/react";

import { useOptimisticViewState } from "@/components/authed/useOptimisticViewState";

describe("useOptimisticViewState", () => {
  it("applies optimistic query immediately when clean", () => {
    const { result } = renderHook(
      ({ query, dirty }) =>
        useOptimisticViewState({
          effectiveQueryString: query,
          hasUnsavedEdits: dirty,
        }),
      {
        initialProps: {
          query: "view=memo",
          dirty: false,
        },
      }
    );

    act(() => {
      result.current.applyOptimisticView("note", "view=note");
    });

    expect(result.current.displayQueryString).toBe("view=note");
    expect(result.current.isOptimisticActive).toBe(true);
  });

  it("does not apply optimistic query while dirty", () => {
    const { result } = renderHook(() =>
      useOptimisticViewState({
        effectiveQueryString: "view=memo",
        hasUnsavedEdits: true,
      })
    );

    act(() => {
      result.current.applyOptimisticView("note", "view=note");
    });

    expect(result.current.displayQueryString).toBe("view=memo");
    expect(result.current.isOptimisticActive).toBe(false);
  });

  it("clears optimistic state when effective query reaches optimistic query", () => {
    const { result, rerender } = renderHook(
      ({ query }) =>
        useOptimisticViewState({
          effectiveQueryString: query,
          hasUnsavedEdits: false,
        }),
      {
        initialProps: {
          query: "view=memo",
        },
      }
    );

    act(() => {
      result.current.applyOptimisticView("note", "view=note");
    });
    expect(result.current.isOptimisticActive).toBe(true);

    rerender({ query: "view=note" });

    expect(result.current.displayQueryString).toBe("view=note");
    expect(result.current.isOptimisticActive).toBe(false);
  });

  it("supports manual rollback", () => {
    const { result } = renderHook(() =>
      useOptimisticViewState({
        effectiveQueryString: "view=memo",
        hasUnsavedEdits: false,
      })
    );

    act(() => {
      result.current.applyOptimisticView("note", "view=note");
    });
    expect(result.current.displayQueryString).toBe("view=note");

    act(() => {
      result.current.rollbackOptimisticView();
    });

    expect(result.current.displayQueryString).toBe("view=memo");
    expect(result.current.isOptimisticActive).toBe(false);
  });

  it("rolls back when URL sync does not complete within timeout", () => {
    jest.useFakeTimers();
    const onSyncTimeout = jest.fn();
    const { result } = renderHook(() =>
      useOptimisticViewState({
        effectiveQueryString: "view=memo",
        hasUnsavedEdits: false,
        syncTimeoutMs: 400,
        onSyncTimeout,
      })
    );

    act(() => {
      result.current.applyOptimisticView("note", "view=note");
    });
    expect(result.current.displayQueryString).toBe("view=note");

    act(() => {
      jest.advanceTimersByTime(401);
    });

    expect(result.current.displayQueryString).toBe("view=memo");
    expect(result.current.isOptimisticActive).toBe(false);
    expect(onSyncTimeout).toHaveBeenCalledWith("note");
    jest.useRealTimers();
  });
});
