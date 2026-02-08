"use client";

import { BookOpenText, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type Mode = "memo" | "note";

type ModeToggleProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const handleToggle = (nextMode: Mode) => {
    onChange(nextMode);
    toast(`未実装です（${nextMode === "memo" ? "メモ" : "ノート"}に切替）`);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-background px-3 py-2">
      <div>
        <p className="text-xs font-medium text-foreground/70">記録モード</p>
        <p className="text-sm font-semibold text-foreground">
          {mode === "memo" ? "メモ" : "ノート"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "memo" ? "default" : "outline"}
          onClick={() => handleToggle("memo")}
        >
          <StickyNote className="h-4 w-4" />
          メモ
        </Button>
        <Button
          size="sm"
          variant={mode === "note" ? "default" : "outline"}
          onClick={() => handleToggle("note")}
        >
          <BookOpenText className="h-4 w-4" />
          ノート
        </Button>
      </div>
    </div>
  );
}
