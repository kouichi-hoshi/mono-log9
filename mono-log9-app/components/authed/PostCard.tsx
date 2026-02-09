"use client";

import { Pencil, Star } from "lucide-react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import type { Post } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="space-y-3 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-foreground/60">{post.date}</p>
          <p className="text-sm font-semibold">{post.mode}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => notifyNotImplemented("お気に入りに追加")}
          >
            <Star className="h-4 w-4" />
            お気に入り
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => notifyNotImplemented("投稿を編集")}
          >
            <Pencil className="h-4 w-4" />
            編集
          </Button>
        </div>
      </div>
      <p className="text-sm text-foreground/80">{post.body}</p>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={`${post.id}-${tag.id}`}
            className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs text-foreground/70"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </article>
  );
}
