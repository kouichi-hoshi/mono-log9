"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_NAME } from "@/lib/appMeta";

function getAppVersion(): string {
  return typeof process.env.NEXT_PUBLIC_APP_VERSION === "string"
    ? process.env.NEXT_PUBLIC_APP_VERSION
    : "0.0.0";
}

type AboutAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AboutAppDialog({ open, onOpenChange }: AboutAppDialogProps) {
  const version = getAppVersion();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>このアプリについて</DialogTitle>
          <DialogDescription className="sr-only">
            アプリ名とバージョンを表示します
          </DialogDescription>
        </DialogHeader>
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="text-sm font-medium text-foreground/70">アプリ名</dt>
            <dd className="text-base font-semibold">{APP_NAME}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-foreground/70">バージョン</dt>
            <dd className="text-base font-semibold">v{version}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
