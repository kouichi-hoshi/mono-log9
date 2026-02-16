"use client";

import * as React from "react";
import { PencilLine, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import MemoEditor from "@/components/authed/MemoEditor";
import { Button } from "@/components/ui/button";
import type { StubPost } from "@/components/authed/stubs";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: StubPost;
  onToggleFavorite: (postId: string) => void;
  onEdit: (postId: string) => void;
  isMemoEditing?: boolean;
  memoEditValue?: string;
  onMemoEditValueChange?: (nextValue: string) => void;
  onCancelMemoEdit?: () => void;
  onSaveMemoEditStub?: (value: string) => void;
};

export default function PostCard({
  post,
  onToggleFavorite,
  onEdit,
  isMemoEditing = false,
  memoEditValue = "",
  onMemoEditValueChange,
  onCancelMemoEdit,
  onSaveMemoEditStub,
}: PostCardProps) {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const isNote = post.mode === "note";
  const noteHasTitle = isNote && Boolean(post.title?.trim());
  const displayContent = noteHasTitle ? post.title ?? "" : post.content;
  const sanitizedNoteHtml = React.useMemo(
    () => (hasHydrated ? sanitizeRichHtml(post.content) : ""),
    [hasHydrated, post.content]
  );
  const hasRichHtml = React.useMemo(
    () => /<(h2|h3|h4|p|ul|ol|li|strong|a|br)(\s|>)/i.test(post.content),
    [post.content]
  );

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleFavorite = () => {
    onToggleFavorite(post.id);
    toast("未実装です");
  };

  if (!isNote && isMemoEditing) {
    return (
      <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
        <MemoEditor
          value={memoEditValue}
          onValueChange={(nextValue) => onMemoEditValueChange?.(nextValue)}
          isEditing
          onCancel={onCancelMemoEdit}
          onSave={(value) => onSaveMemoEditStub?.(value)}
        />
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
      {isNote && <div className="mb-3 text-xs text-foreground/60">{post.createdAt}</div>}
      <div
        data-testid="post-content"
        className={cn(
          "text-sm leading-relaxed",
          !isNote && "whitespace-pre-wrap",
          isNote && !expanded && !noteHasTitle && "max-h-48 overflow-hidden"
        )}
      >
        {isNote && !noteHasTitle ? (
          hasRichHtml ? (
            <div
              className="md-content"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: sanitizedNoteHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap">{post.content}</div>
          )
        ) : (
          displayContent
        )}
      </div>

      {isNote && !noteHasTitle && (
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
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(post.id)}>
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
