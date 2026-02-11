"use client";

import PostEditor from "@/components/authed/PostEditor";
import type { PostMode, ViewMode } from "@/components/authed/stubs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderPostAreaProps = {
  viewMode: ViewMode;
  composeTab: PostMode;
  onComposeTabChange: (tab: PostMode) => void;
};

export default function HeaderPostArea({
  viewMode,
  composeTab,
  onComposeTabChange,
}: HeaderPostAreaProps) {
  const renderEditor = (mode: PostMode) => {
    if (mode === "memo") {
      return (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="メモを入力"
            className="h-11 min-w-0 flex-1 rounded-md border border-foreground/20 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
          <Button type="button" size="sm" className="h-11 shrink-0">
            保存
          </Button>
        </div>
      );
    }

    return <PostEditor mode="note" />;
  };

  if (viewMode === "memo") {
    return renderEditor("memo");
  }

  if (viewMode === "note") {
    return renderEditor("note");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            composeTab === "memo" &&
              "bg-foreground text-background hover:bg-foreground/90"
          )}
          onClick={() => onComposeTabChange("memo")}
        >
          メモ
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            composeTab === "note" &&
              "bg-foreground text-background hover:bg-foreground/90"
          )}
          onClick={() => onComposeTabChange("note")}
        >
          ノート
        </Button>
      </div>
      <div>{renderEditor(composeTab)}</div>
    </div>
  );
}
