"use client";

import * as React from "react";

import { buildQueryForNoteComposerClose } from "@/lib/authedQueryState";
import type { ReloginNoteDraft } from "@/lib/auth/reloginDraft";
import { clonePostContent } from "@/lib/posts/content";
import type { PostContent, PostRecord } from "@/lib/posts/types";

export type UseNoteComposerStateInput = {
  effectiveQueryString: string;
  noteComposer: { mode: "none" | "create" | "edit"; postId?: string };
  isNoteModalOpen: boolean;
  noteModalDirty: boolean;
  visibleItems: PostRecord[];
  restoredNoteDraft: ReloginNoteDraft | null;
  listState: { hasData: boolean; isFetching: boolean };
  findInCachedPostLists: (postId: string) => PostRecord | null;
  closeNoteModalNow: () => void;
  onMissingTarget: (nextQuery: string) => void;
  onConsumeRestoredDraft: () => void;
};

export type UseNoteComposerStateOutput = {
  noteModalMode: "create" | "edit";
  editingNotePostId: string | null;
  noteModalInitialTitle: string;
  noteModalInitialContent: PostContent | null;
  noteModalInitialPlainText: string;
};

export function useNoteComposerState({
  effectiveQueryString,
  noteComposer,
  isNoteModalOpen,
  noteModalDirty,
  visibleItems,
  restoredNoteDraft,
  listState,
  findInCachedPostLists,
  closeNoteModalNow,
  onMissingTarget,
  onConsumeRestoredDraft,
}: UseNoteComposerStateInput): UseNoteComposerStateOutput {
  const [noteModalMode, setNoteModalMode] = React.useState<"create" | "edit">("create");
  const [editingNotePostId, setEditingNotePostId] = React.useState<string | null>(null);
  const [noteModalInitialTitle, setNoteModalInitialTitle] = React.useState("");
  const [noteModalInitialContent, setNoteModalInitialContent] = React.useState<PostContent | null>(
    null
  );
  const [noteModalInitialPlainText, setNoteModalInitialPlainText] = React.useState("");

  const initializedNoteComposerRef = React.useRef<string | null>(null);
  const handledMissingNoteComposerRef = React.useRef<string | null>(null);

  const resetNoteComposerState = React.useCallback(() => {
    setNoteModalMode("create");
    setEditingNotePostId(null);
    setNoteModalInitialTitle("");
    setNoteModalInitialContent(null);
    setNoteModalInitialPlainText("");
  }, []);

  React.useEffect(() => {
    if (!isNoteModalOpen) {
      if (noteModalDirty) {
        return;
      }

      handledMissingNoteComposerRef.current = null;
      initializedNoteComposerRef.current = null;
      resetNoteComposerState();
      closeNoteModalNow();
      return;
    }

    if (noteComposer.mode === "create") {
      if (initializedNoteComposerRef.current === "create") {
        if (restoredNoteDraft && !noteModalDirty) {
          setNoteModalInitialTitle(restoredNoteDraft.title);
          setNoteModalInitialContent(restoredNoteDraft.contentJson);
          setNoteModalInitialPlainText(restoredNoteDraft.plainText);
          onConsumeRestoredDraft();
        }
        return;
      }

      initializedNoteComposerRef.current = "create";
      handledMissingNoteComposerRef.current = null;
      setNoteModalMode("create");
      setEditingNotePostId(null);
      setNoteModalInitialTitle(restoredNoteDraft?.title ?? "");
      setNoteModalInitialContent(restoredNoteDraft?.contentJson ?? null);
      setNoteModalInitialPlainText(restoredNoteDraft?.plainText ?? "");
      if (restoredNoteDraft) {
        onConsumeRestoredDraft();
      }
      return;
    }

    if (noteComposer.mode !== "edit" || !noteComposer.postId) {
      return;
    }
    const noteComposerPostId = noteComposer.postId;

    const targetPost =
      visibleItems.find((post) => post.id === noteComposerPostId) ??
      findInCachedPostLists(noteComposerPostId);

    if (!targetPost && !listState.hasData && listState.isFetching) {
      return;
    }

    if (
      !targetPost ||
      targetPost.mode !== "note" ||
      typeof targetPost.trashedAt !== "undefined"
    ) {
      const signature = `edit:${noteComposerPostId}`;
      if (handledMissingNoteComposerRef.current === signature) {
        return;
      }

      handledMissingNoteComposerRef.current = signature;
      onMissingTarget(buildQueryForNoteComposerClose(effectiveQueryString).nextQuery);
      return;
    }

    const initializedSignature = `edit:${targetPost.id}`;
    if (initializedNoteComposerRef.current === initializedSignature) {
      return;
    }

    initializedNoteComposerRef.current = initializedSignature;
    handledMissingNoteComposerRef.current = null;
    setNoteModalMode("edit");
    setEditingNotePostId(targetPost.id);
    setNoteModalInitialTitle(restoredNoteDraft?.title ?? targetPost.title ?? "");
    setNoteModalInitialContent(restoredNoteDraft?.contentJson ?? clonePostContent(targetPost.content));
    setNoteModalInitialPlainText(restoredNoteDraft?.plainText ?? targetPost.contentText);
    if (restoredNoteDraft) {
      onConsumeRestoredDraft();
    }
  }, [
    closeNoteModalNow,
    effectiveQueryString,
    findInCachedPostLists,
    isNoteModalOpen,
    listState.hasData,
    listState.isFetching,
    noteComposer,
    noteModalDirty,
    onConsumeRestoredDraft,
    onMissingTarget,
    resetNoteComposerState,
    restoredNoteDraft,
    visibleItems,
  ]);

  return {
    noteModalMode,
    editingNotePostId,
    noteModalInitialTitle,
    noteModalInitialContent,
    noteModalInitialPlainText,
  };
}
