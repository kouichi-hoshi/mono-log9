"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { StubTag } from "@/components/authed/stubs";

type TagEditorProps = {
  tags: StubTag[];
};

export default function TagEditor({ tags }: TagEditorProps) {
  const [value, setValue] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id]
    );
    toast("未実装です（タグ選択）");
  };

  return (
    <div className="space-y-3 rounded-lg border border-foreground/10 bg-background px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Tag className="h-4 w-4 text-foreground/60" />
        タグ編集
      </div>
      <div className="flex items-center gap-2">
        <input
          className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/30"
          placeholder="新しいタグを追加"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          onClick={() => toast("未実装です（タグ追加）")}
          className="inline-flex h-10 items-center gap-1 rounded-md border border-foreground/10 px-3 text-xs font-medium text-foreground/80 hover:border-foreground/30"
        >
          <Plus className="h-4 w-4" />
          追加
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              activeTagIds.includes(tag.id)
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/10 text-foreground/70 hover:border-foreground/30"
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
