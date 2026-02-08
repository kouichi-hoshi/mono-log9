"use client";

import { useId, useState } from "react";
import { Filter, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { StubTag } from "@/components/authed/stubs";

type PostSearchProps = {
  tags: StubTag[];
};

export default function PostSearch({ tags }: PostSearchProps) {
  const favoriteId = useId();
  const [query, setQuery] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const toggleTag = (id: string) => {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id]
    );
    toast("未実装です（タグ絞り込み）");
  };

  const handleClear = () => {
    setQuery("");
    setActiveTagIds([]);
    toast("未実装です（検索条件クリア）");
  };

  return (
    <div className="space-y-3 rounded-lg border border-foreground/10 bg-background px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="h-4 w-4 text-foreground/60" />
        検索
      </div>
      <div className="flex items-center gap-2">
        <input
          className="h-10 w-full rounded-md border border-foreground/10 bg-background px-3 text-sm outline-none focus:border-foreground/30"
          placeholder="キーワードを入力"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button size="sm" onClick={() => toast("未実装です（検索実行）")}>
          検索
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor={favoriteId}
          className="flex items-center gap-2 text-xs text-foreground/70"
        >
          <Checkbox
            id={favoriteId}
            checked={favoriteOnly}
            onCheckedChange={(value) => {
              setFavoriteOnly(Boolean(value));
              toast("未実装です（お気に入りのみ）");
            }}
          />
          お気に入りのみ
        </label>
        <Button size="sm" variant="outline" onClick={handleClear}>
          クリア
        </Button>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/60">
          <Filter className="h-4 w-4" />
          タグで絞り込む
        </p>
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
      {query.length > 0 && (
        <p className="text-xs text-foreground/60">
          検索ワード: <span className="font-medium">{query}</span>
        </p>
      )}
    </div>
  );
}
