"use client";

import * as React from "react";

import EditorActionBar from "@/components/authed/EditorActionBar";
import NoteEditor from "@/components/authed/NoteEditor";
import type { NoteDraft } from "@/components/authed/types";
import FullscreenModal from "@/components/ui/FullscreenModal";
import type { ReloginNoteDraft } from "@/lib/auth/reloginDraft";
import { isNoteDirty } from "@/lib/posts/hasEdits";
import type { PostContent } from "@/lib/posts/types";

type NoteComposerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialTitle?: string;
  initialContentJson?: PostContent | null;
  initialPlainText?: string;
  onSaveStub: (draft: NoteDraft) => Promise<boolean> | boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onDraftChange?: (draft: ReloginNoteDraft | null) => void;
  onRequestClose?: () => void;
};

export default function NoteComposerModal({
  open,
  onOpenChange,
  mode,
  initialTitle,
  initialContentJson,
  initialPlainText,
  onSaveStub,
  onDirtyChange,
  onDraftChange,
  onRequestClose,
}: NoteComposerModalProps) {
  const [draft, setDraft] = React.useState<NoteDraft>({
    title: "",
    contentJson: null,
    plainText: "",
  });
  const [showValidationError, setShowValidationError] = React.useState(false);
  const draftRef = React.useRef(draft);
  const initializedSeedRef = React.useRef<string | null>(null);
  const initializedDraftRef = React.useRef<NoteDraft | null>(null);
  const hasUserEditedRef = React.useRef(false);

  React.useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const handleTitleChange = React.useCallback((nextTitle: string) => {
    setDraft((current) => ({
      ...current,
      title: nextTitle,
    }));
  }, []);

  const handleContentStateChange = React.useCallback(
    ({ contentJson, plainText }: { contentJson: NoteDraft["contentJson"]; plainText: string }) => {
      setDraft((current) => ({
        ...current,
        contentJson,
        plainText,
      }));
    },
    []
  );

  React.useEffect(() => {
    if (!open) {
      onDirtyChange?.(false);
      onDraftChange?.(null);
      initializedSeedRef.current = null;
      initializedDraftRef.current = null;
      hasUserEditedRef.current = false;
      return;
    }

    const nextDraft = {
      title: initialTitle ?? "",
      contentJson: initialContentJson ?? null,
      plainText: initialPlainText ?? "",
    };
    const nextSeed = JSON.stringify({
      mode,
      title: nextDraft.title,
      contentJson: nextDraft.contentJson,
      plainText: nextDraft.plainText,
    });
    const isSeedChanged = initializedSeedRef.current !== nextSeed;

    if (!isSeedChanged) {
      return;
    }

    // Keep user edits when parent props change unexpectedly while the modal stays open.
    if (initializedSeedRef.current !== null && hasUserEditedRef.current) {
      return;
    }

    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
    setShowValidationError(false);
    initializedSeedRef.current = nextSeed;
    initializedDraftRef.current = nextDraft;
    hasUserEditedRef.current = false;
  }, [initialContentJson, initialPlainText, initialTitle, onDirtyChange, onDraftChange, open, mode]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const baselineDraft = initializedDraftRef.current ?? {
      title: initialTitle ?? "",
      contentJson: initialContentJson ?? null,
      plainText: initialPlainText ?? "",
    };
    const dirty = isNoteDirty(
      {
        title: baselineDraft.title,
        content: baselineDraft.contentJson,
      },
      {
        title: draft.title,
        content: draft.contentJson,
      }
    );

    hasUserEditedRef.current = dirty;
    onDraftChange?.(draft);
    onDirtyChange?.(dirty);
  }, [draft, initialContentJson, initialPlainText, initialTitle, onDirtyChange, onDraftChange, open]);

  const closeNoteModal = React.useCallback(() => {
    onOpenChange(false);
    setShowValidationError(false);
  }, [onOpenChange]);

  const requestCloseNoteModal = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    closeNoteModal();
  }, [closeNoteModal, onRequestClose]);

  const handleSaveNote = React.useCallback(async () => {
    if (draft.plainText.trim().length === 0 || !draft.contentJson) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    const saved = await onSaveStub(draft);
    if (saved) {
      closeNoteModal();
    }
  }, [closeNoteModal, draft, onSaveStub]);

  return (
    <FullscreenModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "edit" ? "ノートを編集" : "ノートを書く"}
      contentWrapperClassName="p-5 max-w-4xl"
      onRequestClose={requestCloseNoteModal}
      footer={
        <EditorActionBar
          onClose={requestCloseNoteModal}
          onSave={handleSaveNote}
          closeLabel="キャンセル"
          saveLabel={mode === "edit" ? "更新する" : "保存する"}
        />
      }
    >
      <NoteEditor
        title={draft.title}
        onTitleChange={handleTitleChange}
        contentJson={draft.contentJson}
        onContentStateChange={handleContentStateChange}
        showValidationError={showValidationError}
        onClearValidationError={() => setShowValidationError(false)}
      />
    </FullscreenModal>
  );
}
