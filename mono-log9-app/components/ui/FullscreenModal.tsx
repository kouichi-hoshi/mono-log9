"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type FullscreenModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onRequestClose?: () => void;
};

export default function FullscreenModal({
  open,
  onOpenChange,
  title,
  children,
  onRequestClose,
}: FullscreenModalProps) {
  const handleRequestClose = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    onOpenChange(false);
  }, [onOpenChange, onRequestClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true);
          return;
        }

        handleRequestClose();
      }}
    >
      <DialogContent className="left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 [&>button[aria-label='閉じる']]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center justify-end border-b border-foreground/10 px-4 py-3 md:px-6">
            <Button type="button" variant="outline" size="sm" onClick={handleRequestClose}>
              閉じる
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
