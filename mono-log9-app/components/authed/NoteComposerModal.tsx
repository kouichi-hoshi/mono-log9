"use client";

import * as React from "react";
import { toast } from "sonner";

import EditorActionBar from "@/components/authed/EditorActionBar";
import PostEditor from "@/components/authed/PostEditor";
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
};

export default function NoteComposerModal({ open, onOpenChange }: NoteComposerModalProps) {
  const [noteDraft, setNoteDraft] = React.useState("");
  const [showValidationError, setShowValidationError] = React.useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);

  const closeNoteModal = React.useCallback(() => {
    onOpenChange(false);
    setNoteDraft("");
    setShowValidationError(false);
  }, [onOpenChange]);

  const requestCloseNoteModal = React.useCallback(() => {
    if (noteDraft.trim().length === 0) {
      closeNoteModal();
      return;
    }

    setIsDiscardDialogOpen(true);
  }, [closeNoteModal, noteDraft]);

  const handleSaveNote = React.useCallback(() => {
    if (noteDraft.trim().length === 0) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    toast("未実装です");
  }, [noteDraft]);

  return (
    <>
      <FullscreenModal
        open={open}
        onOpenChange={onOpenChange}
        title="ノートを書く"
        contentWrapperClassName="p-5 max-w-4xl"
        onRequestClose={requestCloseNoteModal}
        footer={<EditorActionBar onClose={requestCloseNoteModal} onSave={handleSaveNote} />}
      >
        <PostEditor
          mode="note"
          value={noteDraft}
          onValueChange={setNoteDraft}
          showActions={false}
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
