"use client";

import * as React from "react";
import { PencilLine, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StubPost } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: StubPost;
  onToggleFavorite: (postId: string) => void;
};

export default function PostCard({ post, onToggleFavorite }: PostCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isNote = post.mode === "note";

  const handleFavorite = () => {
    onToggleFavorite(post.id);
    toast("未実装です");
  };

  return (
    <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
      {isNote && (
        <div className="mb-3 text-xs text-foreground/60">{post.createdAt}</div>
      )}
      <div
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed",
          isNote && !expanded && "max-h-48 overflow-hidden"
        )}
      >
        {post.content}
      </div>

      {isNote && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 text-xs text-foreground/70 hover:text-foreground"
        >
          {expanded ? "折りたたむ" : "もっと見る"}
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleFavorite}>
          <Star
            className={cn(
              "h-4 w-4",
              post.favorite ? "fill-amber-400 text-amber-500" : "text-foreground/60"
            )}
          />
          お気に入り
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toast("未実装です")}
        >
          <PencilLine className="h-4 w-4 text-foreground/60" />
          編集
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toast("未実装です")}
        >
          <Trash2 className="h-4 w-4 text-foreground/60" />
          削除
        </Button>
      </div>
    </article>
  );
}
