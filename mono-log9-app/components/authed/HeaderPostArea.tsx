"use client";

import PostEditor from "@/components/authed/PostEditor";
import type { PostMode } from "@/components/authed/stubs";

import { Button } from "@/components/ui/button";

type HeaderPostAreaProps = {
  mode: PostMode;
};

export default function HeaderPostArea({ mode }: HeaderPostAreaProps) {
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

  return <PostEditor mode={mode} />;
}
