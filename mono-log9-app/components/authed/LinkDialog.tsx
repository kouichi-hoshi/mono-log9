"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
};

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export default function LinkDialog({ open, onOpenChange, onSubmit }: LinkDialogProps) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setUrl("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = React.useCallback(() => {
    if (url.trim().length === 0) {
      setError("URLを入力してください");
      return;
    }

    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("有効なURLを入力してください");
      return;
    }

    setError(null);
    onSubmit(normalized);
    onOpenChange(false);
  }, [onOpenChange, onSubmit, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>リンクを設定</DialogTitle>
          <DialogDescription>選択したテキストにURLを適用します。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="link-url-input" className="text-sm font-medium">
            URL
          </label>
          <input
            id="link-url-input"
            aria-label="リンクURL"
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="https://example.com"
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="button" onClick={handleSubmit}>
            適用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
