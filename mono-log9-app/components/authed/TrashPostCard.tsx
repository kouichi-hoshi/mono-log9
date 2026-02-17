"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PostRecord } from "@/lib/posts/types";

type TrashPostCardProps = {
  post: PostRecord;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onRestore: (postId: string) => void;
  onPermanentDelete: (postId: string) => void;
};

export default function TrashPostCard({
  post,
  checked,
  onCheckedChange,
  onRestore,
  onPermanentDelete,
}: TrashPostCardProps) {
  const body = post.mode === "note" && post.title?.trim() ? post.title : post.contentText;
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
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onRestore(post.id)}>
          復元
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPermanentDelete(post.id)}>
          完全に削除
        </Button>
      </div>
    </article>
  );
}
