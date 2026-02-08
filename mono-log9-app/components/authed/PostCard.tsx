"use client";

import { useId, useState } from "react";
import { Calendar, PencilLine, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { StubPost } from "@/components/authed/stubs";

type PostCardProps = {
  post: StubPost;
};

export default function PostCard({ post }: PostCardProps) {
  const checkboxId = useId();
  const [starred, setStarred] = useState(post.starred);
  const [checked, setChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isLongNote = post.mode === "note" && post.body.length > 140;
  const bodyText =
    isLongNote && !expanded ? `${post.body.slice(0, 140)}…` : post.body;

  return (
    <article className="space-y-3 rounded-xl border border-foreground/10 bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <span className="rounded-full border border-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
              {post.mode === "memo" ? "Memo" : "Note"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.updatedAt}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold">{post.title}</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setStarred((prev) => !prev);
            toast("未実装です（スター）");
          }}
          className={cn(
            "rounded-full border border-foreground/10 p-2 transition hover:border-foreground/30",
            starred && "border-foreground bg-foreground text-background"
          )}
          aria-label="スターを切り替える"
        >
          <Star className={cn("h-4 w-4", starred && "fill-current")} />
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-foreground/80">{bodyText}</p>
        {isLongNote && (
          <button
            type="button"
            onClick={() => {
              const nextExpanded = !expanded;
              setExpanded(nextExpanded);
              toast(`未実装です（本文${nextExpanded ? "展開" : "折りたたみ"}）`);
            }}
            className="text-xs font-medium text-foreground/60 hover:text-foreground"
          >
            {expanded ? "折りたたむ" : "もっと見る"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-foreground/10 px-2 py-1 text-xs text-foreground/70"
          >
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor={checkboxId}
          className="flex items-center gap-2 text-xs text-foreground/70"
        >
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(value) => {
              setChecked(Boolean(value));
              toast("未実装です（完了フラグ）");
            }}
          />
          レビュー済み
        </label>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => toast("未実装です（編集）")}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1 text-foreground/70 hover:border-foreground/30"
          >
            <PencilLine className="h-3.5 w-3.5" />
            編集
          </button>
          <button
            type="button"
            onClick={() => toast("未実装です（削除）")}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1 text-foreground/70 hover:border-foreground/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            削除
          </button>
        </div>
      </div>
    </article>
  );
}
