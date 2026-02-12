"use client";

import * as React from "react";

import PostEditor from "@/components/authed/PostEditor";
import type { ViewMode } from "@/components/authed/stubs";

import { Button } from "@/components/ui/button";
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

type HeaderPostAreaProps = {
  viewMode: ViewMode;
};

export default function HeaderPostArea({ viewMode }: HeaderPostAreaProps) {
  const [noteDraft, setNoteDraft] = React.useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);

  const openNoteModal = React.useCallback(() => {
    setIsNoteModalOpen(true);
  }, []);

  const closeNoteModal = React.useCallback(() => {
    setIsNoteModalOpen(false);
    setNoteDraft("");
  }, []);

  const requestCloseNoteModal = React.useCallback(() => {
    if (noteDraft.trim().length === 0) {
      closeNoteModal();
      return;
    }

    setIsDiscardDialogOpen(true);
  }, [closeNoteModal, noteDraft]);

  const renderNoteModal = () => (
    <>
      <FullscreenModal
        open={isNoteModalOpen}
        onOpenChange={setIsNoteModalOpen}
        title="ノートを書く"
        onRequestClose={requestCloseNoteModal}
      >
        <PostEditor mode="note" value={noteDraft} onValueChange={setNoteDraft} />
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

  const renderNoteOpenButton = () => (
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openNoteModal}>
      ノートを書く
    </Button>
  );

  if (viewMode === "memo") {
    return <PostEditor mode="memo" />;
  }

  if (viewMode === "note") {
    return (
      <div className="space-y-3">
        {renderNoteOpenButton()}
        {renderNoteModal()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {renderNoteOpenButton()}
      </div>
      <PostEditor mode="memo" />
      {renderNoteModal()}
    </div>
  );
}
