import { act, renderHook } from "@testing-library/react";

import { useGuardedQueryNavigation } from "@/components/authed/useGuardedQueryNavigation";

describe("useGuardedQueryNavigation", () => {
  function setup({
    queryString = "view=note&noteComposer=create",
    hasUnsavedEdits = true,
  }: {
    queryString?: string;
    hasUnsavedEdits?: boolean;
  }) {
    const router = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    const saveCurrentScroll = jest.fn();
    const onOpenMemoEdit = jest.fn();
    const onCloseMemoEdit = jest.fn();
    const onDiscardEdits = jest.fn();

    const rendered = renderHook(
      ({ query, dirty }) =>
        useGuardedQueryNavigation({
          queryString: query,
          hasUnsavedEdits: dirty,
          router,
          saveCurrentScroll,
          onOpenMemoEdit,
          onCloseMemoEdit,
          onDiscardEdits,
        }),
      {
        initialProps: {
          query: queryString,
          dirty: hasUnsavedEdits,
        },
      }
    );

    return {
      ...rendered,
      router,
      onDiscardEdits,
      saveCurrentScroll,
    };
  }

  it("keeps committed query as effective while pending navigation is open", () => {
    const { result, rerender, router } = setup({
      queryString: "view=note&noteComposer=create",
      hasUnsavedEdits: true,
    });

    rerender({ query: "view=memo", dirty: true });

    expect(result.current.isDiscardDialogOpen).toBe(true);
    expect(result.current.pendingAction).toEqual({
      type: "query",
      nextQuery: "view=memo",
      method: "replace",
    });
    expect(result.current.effectiveQueryString).toBe("view=note&noteComposer=create");
    expect(router.replace).toHaveBeenCalledWith("/?view=note&noteComposer=create");
  });

  it("clears pending action when continuing editing", () => {
    const { result, rerender } = setup({
      queryString: "view=note&noteComposer=create",
      hasUnsavedEdits: true,
    });

    rerender({ query: "view=memo", dirty: true });

    act(() => {
      result.current.handleDiscardDialogOpenChange(false);
    });

    expect(result.current.isDiscardDialogOpen).toBe(false);
    expect(result.current.pendingAction).toBeNull();
    expect(result.current.effectiveQueryString).toBe("view=note&noteComposer=create");
  });

  it("applies pending query only after discard and continue", () => {
    const { result, rerender, router, onDiscardEdits } = setup({
      queryString: "view=note&noteComposer=create",
      hasUnsavedEdits: true,
    });

    rerender({ query: "view=memo", dirty: true });

    act(() => {
      result.current.handleDiscardAndContinue();
    });

    expect(onDiscardEdits).toHaveBeenCalledTimes(1);
    expect(result.current.pendingAction).toBeNull();
    expect(result.current.isDiscardDialogOpen).toBe(false);
    expect(result.current.effectiveQueryString).toBe("view=memo");
    expect(router.replace).toHaveBeenLastCalledWith("/?view=memo");
  });

  it("executes action immediately when there are no unsaved edits", () => {
    const { result, router, saveCurrentScroll } = setup({
      queryString: "view=memo",
      hasUnsavedEdits: false,
    });

    act(() => {
      result.current.runOrConfirm({
        type: "query",
        method: "push",
        nextQuery: "view=note",
      });
    });

    expect(result.current.isDiscardDialogOpen).toBe(false);
    expect(result.current.pendingAction).toBeNull();
    expect(saveCurrentScroll).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/?view=note");
  });
});
