import { renderHook } from "@testing-library/react";

import {
  useNoteComposerState,
  resolveNoteComposerSession,
  type UseNoteComposerStateInput,
} from "@/components/authed/useNoteComposerState";
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

function createInput(overrides: Partial<UseNoteComposerStateInput> = {}): UseNoteComposerStateInput {
  return {
    effectiveQueryString: "view=note&noteComposer=create",
    noteComposer: { mode: "create" },
    isNoteModalOpen: true,
    visibleItems: [],
    restoredNoteDraft: null,
    listState: { hasData: true, isFetching: false },
    findInCachedPostLists: () => null,
    ...overrides,
  };
}

describe("useNoteComposerState", () => {
  it("TC-F74-U01: returns create mode with empty defaults", () => {
    const input = createInput();
    const result = resolveNoteComposerSession(input);

    expect(result.mode).toBe("create");
    expect(result.editingNotePostId).toBeNull();
    expect(result.sessionKey).toBe("create");
    expect(result.resolvedDraft).toEqual({
      title: "",
      contentJson: null,
      plainText: "",
    });
    expect(result.missingTargetNextQuery).toBeNull();
    expect(result.shouldConsumeRestoredDraft).toBe(false);
  });

  it("TC-F74-U02: returns restored draft in create mode and flags consumption", () => {
    const restored: ReloginNoteDraft = {
      title: "復元タイトル",
      contentJson: createDocFromPlainText("復元本文"),
      plainText: "復元本文",
    };
    const input = createInput({ restoredNoteDraft: restored });
    const result = resolveNoteComposerSession(input);

    expect(result.resolvedDraft?.title).toBe("復元タイトル");
    expect(result.resolvedDraft?.contentJson).toEqual(restored.contentJson);
    expect(result.resolvedDraft?.plainText).toBe("復元本文");
    expect(result.shouldConsumeRestoredDraft).toBe(true);
  });

  it("TC-F74-U03: returns edit mode from visible items", () => {
    const post = createNotePost("post-001", {
      title: "可視リストのノート",
      content: createDocFromPlainText("可視リスト本文"),
      contentText: "可視リスト本文",
    });
    const input = createInput({
      effectiveQueryString: "view=note&noteComposer=edit:post-001",
      noteComposer: { mode: "edit", postId: "post-001" },
      visibleItems: [post],
    });
    const result = resolveNoteComposerSession(input);

    expect(result.mode).toBe("edit");
    expect(result.editingNotePostId).toBe("post-001");
    expect(result.sessionKey).toBe("edit:post-001");
    expect(result.resolvedDraft?.title).toBe("可視リストのノート");
    expect(result.resolvedDraft?.plainText).toBe("可視リスト本文");
    expect(result.resolvedDraft?.contentJson).toEqual(post.content);
    expect(result.resolvedDraft?.contentJson).not.toBe(post.content);
    expect(result.missingTargetNextQuery).toBeNull();
  });

  it("TC-F74-U04: falls back to cache lookup in edit mode", () => {
    const post = createNotePost("post-002", {
      title: "キャッシュのノート",
      content: createDocFromPlainText("キャッシュ本文"),
      contentText: "キャッシュ本文",
    });
    const findInCachedPostLists = jest.fn((postId: string) =>
      postId === "post-002" ? post : null
    );
    const input = createInput({
      effectiveQueryString: "view=note&noteComposer=edit:post-002",
      noteComposer: { mode: "edit", postId: "post-002" },
      visibleItems: [],
      findInCachedPostLists,
    });
    const result = resolveNoteComposerSession(input);

    expect(findInCachedPostLists).toHaveBeenCalledWith("post-002");
    expect(result.mode).toBe("edit");
    expect(result.editingNotePostId).toBe("post-002");
    expect(result.resolvedDraft?.title).toBe("キャッシュのノート");
  });

  it("TC-F74-U04a: prefers restored draft over target post in edit mode", () => {
    const post = createNotePost("post-002", {
      title: "元のタイトル",
      content: createDocFromPlainText("元の本文"),
      contentText: "元の本文",
    });
    const restored: ReloginNoteDraft = {
      title: "復元タイトル",
      contentJson: createDocFromPlainText("復元本文"),
      plainText: "復元本文",
    };
    const input = createInput({
      effectiveQueryString: "view=note&noteComposer=edit:post-002",
      noteComposer: { mode: "edit", postId: "post-002" },
      visibleItems: [post],
      restoredNoteDraft: restored,
    });
    const result = resolveNoteComposerSession(input);

    expect(result.mode).toBe("edit");
    expect(result.sessionKey).toBe("edit:post-002");
    expect(result.resolvedDraft).toEqual(restored);
    expect(result.shouldConsumeRestoredDraft).toBe(true);
  });

  it("TC-F74-U05: returns missingTargetNextQuery when edit target is missing", () => {
    const effectiveQueryString = "view=note&noteComposer=edit:missing&stubAuth=1";
    const input = createInput({
      effectiveQueryString,
      noteComposer: { mode: "edit", postId: "missing" },
      visibleItems: [],
      listState: { hasData: true, isFetching: false },
      findInCachedPostLists: () => null,
    });
    const result = resolveNoteComposerSession(input);

    expect(result.missingTargetNextQuery).toBe(
      buildQueryForNoteComposerClose(effectiveQueryString).nextQuery
    );
    expect(result.sessionKey).toBeNull();
    expect(result.resolvedDraft).toBeNull();
  });

  it("TC-F74-U06: returns null resolvedDraft while list is fetching for missing edit target", () => {
    const input = createInput({
      effectiveQueryString: "view=note&noteComposer=edit:missing",
      noteComposer: { mode: "edit", postId: "missing" },
      visibleItems: [],
      listState: { hasData: false, isFetching: true },
      findInCachedPostLists: () => null,
    });
    const result = resolveNoteComposerSession(input);

    expect(result.missingTargetNextQuery).toBeNull();
    expect(result.sessionKey).toBe("edit:missing");
    expect(result.resolvedDraft).toBeNull();
  });

  it("TC-F74-U07: returns sessionKey null when modal closed and not dirty", () => {
    const post = createNotePost("post-003");
    const input = createInput({
      effectiveQueryString: "view=note",
      noteComposer: { mode: "none" },
      isNoteModalOpen: false,
      visibleItems: [post],
    });
    const result = resolveNoteComposerSession(input);

    expect(result.sessionKey).toBeNull();
    expect(result.resolvedDraft).toBeNull();
  });

  it("TC-F74-U08: returns edit session when modal closed but dirty (discard not yet confirmed)", () => {
    const post = createNotePost("post-004", {
      title: "dirty保持ノート",
      content: createDocFromPlainText("dirty保持本文"),
      contentText: "dirty保持本文",
    });
    const input = createInput({
      effectiveQueryString: "view=note&noteComposer=edit:post-004",
      noteComposer: { mode: "edit", postId: "post-004" },
      isNoteModalOpen: false,
      visibleItems: [post],
    });
    const result = resolveNoteComposerSession(input);

    expect(result.sessionKey).toBeNull();
    expect(result.resolvedDraft).toBeNull();
  });

  it("hook returns same result as resolver", () => {
    const input = createInput();
    const { result } = renderHook(() => useNoteComposerState(input));

    expect(result.current).toEqual(resolveNoteComposerSession(input));
  });
});
