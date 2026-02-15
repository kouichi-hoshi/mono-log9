"use client";

import type { StubTrashPost } from "@/components/authed/stubs";
import { Checkbox } from "@/components/ui/checkbox";

type TrashPostCardProps = {
  post: StubTrashPost;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export default function TrashPostCard({ post, checked, onCheckedChange }: TrashPostCardProps) {
  const body = post.mode === "note" && post.title?.trim() ? post.title : post.content;
  const checkboxId = `trash-select-${post.id}`;

  return (
    <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-3 text-xs text-foreground/60">
        <label htmlFor={checkboxId} className="inline-flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(next) => onCheckedChange(Boolean(next))}
            aria-label={`${post.id}を選択`}
          />
          <span className="sr-only">選択</span>
        </label>
        <span>
          {post.mode === "memo" ? "メモ" : "ノート"} / {post.createdAt}
        </span>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{body}</div>
    </article>
  );
}
