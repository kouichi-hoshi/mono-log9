"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FullscreenModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onRequestClose?: () => void;
  contentWrapperClassName?: string;
};

export default function FullscreenModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onRequestClose,
  contentWrapperClassName,
}: FullscreenModalProps) {
  const handleRequestClose = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    onOpenChange(false);
  }, [onOpenChange, onRequestClose]);

  const handleContentPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      handleRequestClose();
    },
    [handleRequestClose]
  );

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
      <DialogContent
        showCloseButton={false}
        className="left-0 top-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0"
        onPointerDown={handleContentPointerDown}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description ?? title}</DialogDescription>
        <div className={cn("mx-auto h-full w-full", contentWrapperClassName)}>
          <div className="flex h-full flex-col bg-background">
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <div>{footer}</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
