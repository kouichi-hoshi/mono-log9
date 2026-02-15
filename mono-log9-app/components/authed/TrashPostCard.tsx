"use client";

import type { StubTrashPost } from "@/components/authed/stubs";

type TrashPostCardProps = {
  post: StubTrashPost;
};

export default function TrashPostCard({ post }: TrashPostCardProps) {
  const body = post.mode === "note" && post.title?.trim() ? post.title : post.content;

  return (
    <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
      <div className="mb-2 text-xs text-foreground/60">
        {post.mode === "memo" ? "メモ" : "ノート"} / {post.createdAt}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{body}</div>
    </article>
  );
}
