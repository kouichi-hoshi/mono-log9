"use client";

import * as React from "react";

import EditorActionBar from "@/components/authed/EditorActionBar";
import NoteEditor from "@/components/authed/NoteEditor";
import type { NoteDraft } from "@/components/authed/types";
import FullscreenModal from "@/components/ui/FullscreenModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NoteComposerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialTitle?: string;
  initialContent?: string;
  onSaveStub: (draft: NoteDraft) => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toEditorContent(value?: string) {
  if (!value || value.trim().length === 0) {
    return "";
  }

  if (value.includes("<") && value.includes(">")) {
    return value;
  }

  return `<p>${escapeHtml(value).replaceAll("\n", "<br/>")}</p>`;
}

export default function NoteComposerModal({
  open,
  onOpenChange,
  mode,
  initialTitle,
  initialContent,
  onSaveStub,
}: NoteComposerModalProps) {
  const [contentHtml, setContentHtml] = React.useState("");
  const [draft, setDraft] = React.useState<NoteDraft>({
    title: "",
    contentJson: null,
    plainText: "",
  });
  const [showValidationError, setShowValidationError] = React.useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);

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
      return;
    }

    setContentHtml(toEditorContent(initialContent));
    setDraft({
      title: initialTitle ?? "",
      contentJson: null,
      plainText: initialContent ?? "",
    });
    setShowValidationError(false);
    setIsDiscardDialogOpen(false);
  }, [initialContent, initialTitle, open, mode]);

  const closeNoteModal = React.useCallback(() => {
    onOpenChange(false);
    setShowValidationError(false);
    setIsDiscardDialogOpen(false);
  }, [onOpenChange]);

  const hasAnyInput = draft.title.trim().length > 0 || draft.plainText.trim().length > 0;

  const requestCloseNoteModal = React.useCallback(() => {
    if (!hasAnyInput) {
      closeNoteModal();
      return;
    }

    setIsDiscardDialogOpen(true);
  }, [closeNoteModal, hasAnyInput]);

  const handleSaveNote = React.useCallback(() => {
    if (draft.plainText.trim().length === 0) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    onSaveStub(draft);
    closeNoteModal();
  }, [closeNoteModal, draft, onSaveStub]);

  return (
    <>
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
          content={contentHtml}
          onContentChange={setContentHtml}
          onContentStateChange={handleContentStateChange}
          showValidationError={showValidationError}
          onClearValidationError={() => setShowValidationError(false)}
        />
      </FullscreenModal>

      <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>入力中の内容を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              閉じると入力中のノートは削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDiscardDialogOpen(false);
                closeNoteModal();
              }}
            >
              破棄して閉じる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
