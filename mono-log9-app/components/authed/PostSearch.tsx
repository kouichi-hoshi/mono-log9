"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import TagCloud from "@/components/authed/TagCloud";
import type { Tag } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type PostSearchProps = {
  tags: Tag[];
};

export default function PostSearch({ tags }: PostSearchProps) {
  const [query, setQuery] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border border-foreground/10 bg-background/80 p-4">
      <p className="text-sm font-semibold">投稿検索</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="キーワードで検索"
            className="h-10 w-full rounded-md border border-foreground/15 bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
        </div>
        <Button type="button" onClick={() => notifyNotImplemented("検索する")}>
          検索する
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/70">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={favoriteOnly}
            onCheckedChange={(checked) => {
              const nextValue = Boolean(checked);
              setFavoriteOnly(nextValue);
              notifyNotImplemented(
                nextValue ? "お気に入りのみ表示" : "お気に入り解除"
              );
            }}
          />
          お気に入り
        </label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => notifyNotImplemented("検索条件を解除")}
        >
          <X className="h-4 w-4" />
          検索条件を解除
        </Button>
      </div>
      <TagCloud tags={tags} label="タグクラウド" />
    </div>
  );
}
