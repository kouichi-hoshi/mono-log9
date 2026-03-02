import { renderHook, waitFor } from "@testing-library/react";

import { useNoteComposerState, type UseNoteComposerStateInput } from "@/components/authed/useNoteComposerState";
import { buildQueryForNoteComposerClose } from "@/lib/authedQueryState";
import type { ReloginNoteDraft } from "@/lib/auth/reloginDraft";
import { createDocFromPlainText } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";

function createNotePost(id: string, overrides: Partial<PostRecord> = {}): PostRecord {
  return {
    id,
    mode: "note",
    title: `${id}-title`,
    content: createDocFromPlainText(`${id}-content`),
    contentText: `${id}-content`,
    favorite: false,
    createdAt: "2026-03-01 10:00",
    ...overrides,
  };
}

function setup(overrides: Partial<UseNoteComposerStateInput> = {}) {
  const closeNoteModalNow = jest.fn();
  const onMissingTarget = jest.fn();
  const onConsumeRestoredDraft = jest.fn();
  const findInCachedPostLists = jest.fn(() => null);

  const baseInput: UseNoteComposerStateInput = {
    effectiveQueryString: "view=note&noteComposer=create",
    noteComposer: { mode: "create" },
    isNoteModalOpen: true,
    noteModalDirty: false,
    visibleItems: [],
    restoredNoteDraft: null,
    listState: { hasData: true, isFetching: false },
    findInCachedPostLists,
    closeNoteModalNow,
    onMissingTarget,
    onConsumeRestoredDraft,
  };

  const rendered = renderHook((props: UseNoteComposerStateInput) => useNoteComposerState(props), {
    initialProps: {
      ...baseInput,
      ...overrides,
    },
  });

  return {
    ...rendered,
    closeNoteModalNow,
    onMissingTarget,
    onConsumeRestoredDraft,
    findInCachedPostLists,
  };
}

describe("useNoteComposerState", () => {
  it("TC-F74-U01: initializes create mode with empty defaults", async () => {
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.noteModalMode).toBe("create");
      expect(result.current.editingNotePostId).toBeNull();
      expect(result.current.noteModalInitialTitle).toBe("");
      expect(result.current.noteModalInitialContent).toBeNull();
      expect(result.current.noteModalInitialPlainText).toBe("");
    });
  });

  it("TC-F74-U02: applies restored draft in create mode and consumes it", async () => {
    const restored: ReloginNoteDraft = {
      title: "復元タイトル",
      contentJson: createDocFromPlainText("復元本文"),
      plainText: "復元本文",
    };
    const { result, onConsumeRestoredDraft } = setup({
      restoredNoteDraft: restored,
    });

    await waitFor(() => {
      expect(result.current.noteModalInitialTitle).toBe("復元タイトル");
      expect(result.current.noteModalInitialContent).toEqual(restored.contentJson);
      expect(result.current.noteModalInitialPlainText).toBe("復元本文");
      expect(onConsumeRestoredDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-F74-U03: initializes edit mode from visible items", async () => {
    const post = createNotePost("post-001", {
      title: "可視リストのノート",
      content: createDocFromPlainText("可視リスト本文"),
      contentText: "可視リスト本文",
    });
    const { result } = setup({
      effectiveQueryString: "view=note&noteComposer=edit:post-001",
      noteComposer: { mode: "edit", postId: "post-001" },
      visibleItems: [post],
    });

    await waitFor(() => {
      expect(result.current.noteModalMode).toBe("edit");
      expect(result.current.editingNotePostId).toBe("post-001");
      expect(result.current.noteModalInitialTitle).toBe("可視リストのノート");
      expect(result.current.noteModalInitialPlainText).toBe("可視リスト本文");
      expect(result.current.noteModalInitialContent).toEqual(post.content);
      expect(result.current.noteModalInitialContent).not.toBe(post.content);
    });
  });

  it("TC-F74-U04: falls back to cache lookup in edit mode", async () => {
    const post = createNotePost("post-002", {
      title: "キャッシュのノート",
      content: createDocFromPlainText("キャッシュ本文"),
      contentText: "キャッシュ本文",
    });
    const findInCachedPostLists = jest.fn((postId: string) => (postId === "post-002" ? post : null));
    const { result } = setup({
      effectiveQueryString: "view=note&noteComposer=edit:post-002",
      noteComposer: { mode: "edit", postId: "post-002" },
      visibleItems: [],
      findInCachedPostLists,
    });

    await waitFor(() => {
      expect(findInCachedPostLists).toHaveBeenCalledWith("post-002");
      expect(result.current.noteModalMode).toBe("edit");
      expect(result.current.editingNotePostId).toBe("post-002");
      expect(result.current.noteModalInitialTitle).toBe("キャッシュのノート");
    });
  });

  it("TC-F74-U05: requests close once when edit target is missing", async () => {
    const effectiveQueryString = "view=note&noteComposer=edit:missing&stubAuth=1";
    const { rerender, onMissingTarget } = setup({
      effectiveQueryString,
      noteComposer: { mode: "edit", postId: "missing" },
      visibleItems: [],
      listState: { hasData: true, isFetching: false },
      findInCachedPostLists: jest.fn(() => null),
    });

    await waitFor(() => {
      expect(onMissingTarget).toHaveBeenCalledTimes(1);
      expect(onMissingTarget).toHaveBeenCalledWith(
        buildQueryForNoteComposerClose(effectiveQueryString).nextQuery
      );
    });

    rerender({
      effectiveQueryString,
      noteComposer: { mode: "edit", postId: "missing" },
      isNoteModalOpen: true,
      noteModalDirty: false,
      visibleItems: [],
      restoredNoteDraft: null,
      listState: { hasData: true, isFetching: false },
      findInCachedPostLists: jest.fn(() => null),
      closeNoteModalNow: jest.fn(),
      onMissingTarget,
      onConsumeRestoredDraft: jest.fn(),
    });

    await waitFor(() => {
      expect(onMissingTarget).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-F74-U06: does not treat missing edit target as missing while list is fetching", async () => {
    const { onMissingTarget } = setup({
      effectiveQueryString: "view=note&noteComposer=edit:missing",
      noteComposer: { mode: "edit", postId: "missing" },
      visibleItems: [],
      listState: { hasData: false, isFetching: true },
      findInCachedPostLists: jest.fn(() => null),
    });

    await waitFor(() => {
      expect(onMissingTarget).not.toHaveBeenCalled();
    });
  });

  it("TC-F74-U07: resets state on clean close", async () => {
    const post = createNotePost("post-003", {
      title: "編集中ノート",
      content: createDocFromPlainText("編集中本文"),
      contentText: "編集中本文",
    });
    const { result, rerender, closeNoteModalNow } = setup({
      effectiveQueryString: "view=note&noteComposer=edit:post-003",
      noteComposer: { mode: "edit", postId: "post-003" },
      visibleItems: [post],
    });

    await waitFor(() => {
      expect(result.current.noteModalMode).toBe("edit");
      expect(result.current.editingNotePostId).toBe("post-003");
    });

    rerender({
      effectiveQueryString: "view=note",
      noteComposer: { mode: "none" },
      isNoteModalOpen: false,
      noteModalDirty: false,
      visibleItems: [post],
      restoredNoteDraft: null,
      listState: { hasData: true, isFetching: false },
      findInCachedPostLists: jest.fn(() => null),
      closeNoteModalNow,
      onMissingTarget: jest.fn(),
      onConsumeRestoredDraft: jest.fn(),
    });

    await waitFor(() => {
      expect(closeNoteModalNow).toHaveBeenCalledTimes(1);
      expect(result.current.noteModalMode).toBe("create");
      expect(result.current.editingNotePostId).toBeNull();
      expect(result.current.noteModalInitialTitle).toBe("");
      expect(result.current.noteModalInitialContent).toBeNull();
      expect(result.current.noteModalInitialPlainText).toBe("");
    });
  });

  it("TC-F74-U08: keeps state on close when dirty", async () => {
    const post = createNotePost("post-004", {
      title: "dirty保持ノート",
      content: createDocFromPlainText("dirty保持本文"),
      contentText: "dirty保持本文",
    });
    const { result, rerender, closeNoteModalNow } = setup({
      effectiveQueryString: "view=note&noteComposer=edit:post-004",
      noteComposer: { mode: "edit", postId: "post-004" },
      visibleItems: [post],
    });

    await waitFor(() => {
      expect(result.current.noteModalMode).toBe("edit");
      expect(result.current.editingNotePostId).toBe("post-004");
    });

    rerender({
      effectiveQueryString: "view=note",
      noteComposer: { mode: "none" },
      isNoteModalOpen: false,
      noteModalDirty: true,
      visibleItems: [post],
      restoredNoteDraft: null,
      listState: { hasData: true, isFetching: false },
      findInCachedPostLists: jest.fn(() => null),
      closeNoteModalNow,
      onMissingTarget: jest.fn(),
      onConsumeRestoredDraft: jest.fn(),
    });

    await waitFor(() => {
      expect(closeNoteModalNow).not.toHaveBeenCalled();
      expect(result.current.noteModalMode).toBe("edit");
      expect(result.current.editingNotePostId).toBe("post-004");
      expect(result.current.noteModalInitialTitle).toBe("dirty保持ノート");
      expect(result.current.noteModalInitialPlainText).toBe("dirty保持本文");
    });
  });
});
