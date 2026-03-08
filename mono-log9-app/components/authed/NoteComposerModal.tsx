"use client";

import * as React from "react";

import EditorActionBar from "@/components/authed/EditorActionBar";
import NoteEditor from "@/components/authed/NoteEditor";
import type { NoteDraft } from "@/components/authed/types";
import FullscreenModal from "@/components/ui/FullscreenModal";

type NoteComposerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  draft: NoteDraft;
  onDraftChange: (draft: NoteDraft) => void;
  onSaveStub: (draft: NoteDraft) => Promise<boolean> | boolean;
  onRequestClose?: () => void;
  /** Stable key to remount editor when switching create/edit targets (e.g. "create" or "edit:postId") */
  sessionKey?: string;
};

const EMPTY_DRAFT: NoteDraft = {
  title: "",
  contentJson: null,
  plainText: "",
};

export default function NoteComposerModal({
  open,
  onOpenChange,
  mode,
  draft,
  onDraftChange,
  onSaveStub,
  onRequestClose,
  sessionKey,
}: NoteComposerModalProps) {
  const [showValidationError, setShowValidationError] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleTitleChange = React.useCallback(
    (nextTitle: string) => {
      onDraftChange({
        ...draft,
        title: nextTitle,
      });
    },
    [draft, onDraftChange]
  );

  const handleContentStateChange = React.useCallback(
    ({ contentJson, plainText }: { contentJson: NoteDraft["contentJson"]; plainText: string }) => {
      onDraftChange({
        ...draft,
        contentJson,
        plainText,
      });
    },
    [draft, onDraftChange]
  );

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
    if (isSaving) {
      return;
    }

    if (draft.plainText.trim().length === 0 || !draft.contentJson) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    setIsSaving(true);
    let saved = false;
    try {
      saved = await onSaveStub(draft);
    } finally {
      setIsSaving(false);
    }
    if (saved) {
      closeNoteModal();
    }
  }, [closeNoteModal, draft, isSaving, onSaveStub]);

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
          saveLabel={isSaving ? "保存中..." : mode === "edit" ? "更新する" : "保存する"}
          saveDisabled={isSaving}
        />
      }
    >
      <NoteEditor
        key={sessionKey ?? (mode === "create" ? "create" : "edit")}
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

export { EMPTY_DRAFT };
