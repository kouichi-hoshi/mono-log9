"use client";

import { buildQueryForNoteComposerClose } from "@/lib/authedQueryState";
import type { ReloginNoteDraft } from "@/lib/auth/reloginDraft";
import { clonePostContent } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";
import type { NoteDraft } from "@/components/authed/types";

export type UseNoteComposerStateInput = {
  effectiveQueryString: string;
  noteComposer: { mode: "none" | "create" | "edit"; postId?: string };
  isNoteModalOpen: boolean;
  visibleItems: PostRecord[];
  restoredNoteDraft: ReloginNoteDraft | null;
  listState: { hasData: boolean; isFetching: boolean };
  findInCachedPostLists: (postId: string) => PostRecord | null;
};

export type UseNoteComposerStateOutput = {
  mode: "create" | "edit";
  editingNotePostId: string | null;
  sessionKey: string | null;
  resolvedDraft: NoteDraft | null;
  missingTargetNextQuery: string | null;
  shouldConsumeRestoredDraft: boolean;
};

function resolveNoteComposerSession(
  input: UseNoteComposerStateInput
): Omit<UseNoteComposerStateOutput, "shouldConsumeRestoredDraft"> & {
  shouldConsumeRestoredDraft: boolean;
} {
  const {
    effectiveQueryString,
    noteComposer,
    isNoteModalOpen,
    visibleItems,
    restoredNoteDraft,
    listState,
    findInCachedPostLists,
  } = input;

  if (!isNoteModalOpen) {
    return {
      mode: "create",
      editingNotePostId: null,
      sessionKey: null,
      resolvedDraft: null,
      missingTargetNextQuery: null,
      shouldConsumeRestoredDraft: false,
    };
  }

  if (noteComposer.mode === "create") {
    const draft: NoteDraft = {
      title: restoredNoteDraft?.title ?? "",
      contentJson: restoredNoteDraft?.contentJson ?? null,
      plainText: restoredNoteDraft?.plainText ?? "",
    };
    return {
      mode: "create",
      editingNotePostId: null,
      sessionKey: "create",
      resolvedDraft: draft,
      missingTargetNextQuery: null,
      shouldConsumeRestoredDraft: Boolean(restoredNoteDraft),
    };
  }

  if (noteComposer.mode !== "edit" || !noteComposer.postId) {
    return {
      mode: "create",
      editingNotePostId: null,
      sessionKey: null,
      resolvedDraft: null,
      missingTargetNextQuery: null,
      shouldConsumeRestoredDraft: false,
    };
  }

  const postId = noteComposer.postId;
  const targetPost =
    visibleItems.find((p) => p.id === postId) ?? findInCachedPostLists(postId);

  if (restoredNoteDraft) {
    if (
      targetPost &&
      (targetPost.mode !== "note" || typeof targetPost.trashedAt !== "undefined")
    ) {
      return {
        mode: "edit",
        editingNotePostId: postId,
        sessionKey: null,
        resolvedDraft: null,
        missingTargetNextQuery: buildQueryForNoteComposerClose(effectiveQueryString)
          .nextQuery,
        shouldConsumeRestoredDraft: false,
      };
    }

    if (!targetPost && listState.hasData && !listState.isFetching) {
      return {
        mode: "edit",
        editingNotePostId: postId,
        sessionKey: null,
        resolvedDraft: null,
        missingTargetNextQuery: buildQueryForNoteComposerClose(effectiveQueryString)
          .nextQuery,
        shouldConsumeRestoredDraft: false,
      };
    }

    return {
      mode: "edit",
      editingNotePostId: postId,
      sessionKey: `edit:${postId}`,
      resolvedDraft: {
        title: restoredNoteDraft.title,
        contentJson: restoredNoteDraft.contentJson,
        plainText: restoredNoteDraft.plainText,
      },
      missingTargetNextQuery: null,
      shouldConsumeRestoredDraft: true,
    };
  }

  if (!targetPost && !listState.hasData && listState.isFetching) {
    return {
      mode: "edit",
      editingNotePostId: postId,
      sessionKey: `edit:${postId}`,
      resolvedDraft: null,
      missingTargetNextQuery: null,
      shouldConsumeRestoredDraft: false,
    };
  }

  if (
    !targetPost ||
    targetPost.mode !== "note" ||
    typeof targetPost.trashedAt !== "undefined"
  ) {
    return {
      mode: "edit",
      editingNotePostId: postId,
      sessionKey: null,
      resolvedDraft: null,
      missingTargetNextQuery: buildQueryForNoteComposerClose(effectiveQueryString)
        .nextQuery,
      shouldConsumeRestoredDraft: false,
    };
  }

  const draft: NoteDraft = {
    title: targetPost.title ?? "",
    contentJson: clonePostContent(targetPost.content),
    plainText: targetPost.contentText,
  };
  return {
    mode: "edit",
    editingNotePostId: targetPost.id,
    sessionKey: `edit:${targetPost.id}`,
    resolvedDraft: draft,
    missingTargetNextQuery: null,
    shouldConsumeRestoredDraft: false,
  };
}

export function useNoteComposerState(
  input: UseNoteComposerStateInput
): UseNoteComposerStateOutput {
  return resolveNoteComposerSession(input);
}

export { resolveNoteComposerSession };
