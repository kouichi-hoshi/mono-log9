"use client";

import * as React from "react";

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

type TrashDeleteDialogProps = {
  open: boolean;
  mode: "selected" | "all" | null;
  selectedCount: number;
  submitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function TrashDeleteDialog({
  open,
  mode,
  selectedCount,
  submitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: TrashDeleteDialogProps) {
  const title = React.useMemo(() => {
    if (mode === "selected") {
      return `${selectedCount}件の投稿を完全に削除しますか?`;
    }

    return "ごみ箱内のすべての投稿を完全に削除しますか?";
  }, [mode, selectedCount]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-70">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{errorMessage ?? "この操作は取り消せません"}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {submitting ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
