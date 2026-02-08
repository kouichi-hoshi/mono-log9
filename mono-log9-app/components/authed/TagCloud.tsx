"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { StubTag } from "@/components/authed/stubs";

type TagCloudProps = {
  tags: StubTag[];
};

export default function TagCloud({ tags }: TagCloudProps) {
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id]
    );
    toast("未実装です（タグクラウド）");
  };

  return (
    <section className="rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-foreground/60" />
        タグクラウド
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
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
            <span className="ml-2 text-[10px] text-foreground/50">
              {tag.count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
