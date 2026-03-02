"use client";

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

type DiscardConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function DiscardConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: DiscardConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-70">
        <AlertDialogHeader>
          <AlertDialogTitle>編集中の内容があります。破棄して続行しますか？</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            編集中の内容を破棄して続行するか確認します
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>編集を続ける</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>破棄して続行</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
