"use client";

import * as React from "react";
import { PencilLine, Star, Trash2 } from "lucide-react";

import MemoEditor from "@/components/authed/MemoEditor";
import { Button } from "@/components/ui/button";
import { toSanitizableHtml } from "@/lib/posts/contentHtml";
import type { PostRecord } from "@/lib/posts/types";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostRecord;
  onToggleFavorite: (postId: string) => void;
  onEdit: (postId: string) => void;
  onMoveToTrash: (postId: string) => void;
  isMemoEditing?: boolean;
  memoEditValue?: string;
  onMemoEditValueChange?: (nextValue: string) => void;
  onCancelMemoEdit?: () => void;
  onSaveMemoEditStub?: (value: string) => Promise<boolean> | boolean;
};

const MEMO_URL_REGEX = /https?:\/\/[^\s]+/g;
const TRAILING_PUNCTUATION_REGEX = /[。、.,!?)}\]]+$/;

function splitMemoUrlToken(token: string): { core: string; trailing: string } {
  const trimmed = token.trim();
  const match = trimmed.match(TRAILING_PUNCTUATION_REGEX);
  if (!match) {
    return { core: trimmed, trailing: "" };
  }

  const trailing = match[0];
  return {
    core: trimmed.slice(0, trimmed.length - trailing.length),
    trailing,
  };
}

function toSafeMemoHref(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function renderMemoContent(contentText: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  for (const match of contentText.matchAll(MEMO_URL_REGEX)) {
    const url = match[0];
    const start = match.index ?? 0;
    const end = start + url.length;

    if (start > lastIndex) {
      nodes.push(contentText.slice(lastIndex, start));
    }

    const { core, trailing } = splitMemoUrlToken(url);
    const href = toSafeMemoHref(core);
    if (href) {
      nodes.push(
        <a
          key={`memo-link-${keyIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
        >
          {core}
        </a>
      );
      keyIndex += 1;
      if (trailing.length > 0) {
        nodes.push(trailing);
      }
    } else {
      nodes.push(url);
    }

    lastIndex = end;
  }

  if (lastIndex < contentText.length) {
    nodes.push(contentText.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [contentText];
}

export default function PostCard({
  post,
  onToggleFavorite,
  onEdit,
  onMoveToTrash,
  isMemoEditing = false,
  memoEditValue = "",
  onMemoEditValueChange,
  onCancelMemoEdit,
  onSaveMemoEditStub,
}: PostCardProps) {
  const [hasHydrated, setHasHydrated] = React.useState(false);
  const isNote = post.mode === "note";
  const noteTitle = post.title?.trim() ?? "";
  const sanitizedNoteHtml = React.useMemo(
    () => {
      if (!hasHydrated || !isNote) {
        return null;
      }

      const html = toSanitizableHtml(post.content);
      if (!html) {
        return null;
      }

      const sanitized = sanitizeRichHtml(html);
      return sanitized.length > 0 ? sanitized : null;
    },
    [hasHydrated, isNote, post.content]
  );

  React.useEffect(() => {
    setHasHydrated(true);
  }, []);

  const handleFavorite = () => {
    onToggleFavorite(post.id);
  };

  if (!isNote && isMemoEditing) {
    return (
      <article className="rounded-lg border border-foreground/10 p-4 shadow-sm">
        <MemoEditor
          value={memoEditValue}
          onValueChange={(nextValue) => onMemoEditValueChange?.(nextValue)}
          isEditing
          onCancel={onCancelMemoEdit}
          onSave={(value) => onSaveMemoEditStub?.(value) ?? false}
        />
      </article>
    );
  }

  return (
    <article data-testid={`post-card-${post.id}`} className="rounded-lg border border-foreground/10 p-4 shadow-sm">
      <div className="mb-3 text-xs text-foreground/60">{post.createdAt}</div>
      <div data-testid="post-content" className={cn("text-sm leading-relaxed")}>
        {isNote ? (
          <>
            {noteTitle.length > 0 && <p className="mb-2 text-base font-semibold">{noteTitle}</p>}
            {sanitizedNoteHtml ? (
              <div
                className="md-content"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: sanitizedNoteHtml }}
              />
            ) : hasHydrated ? (
              <div className="whitespace-pre-wrap">{post.contentText}</div>
            ) : (
              <div suppressHydrationWarning />
            )}
          </>
        ) : (
          <div className="whitespace-pre-wrap wrap-break-word">{renderMemoContent(post.contentText)}</div>
        )}
      </div>

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
          onClick={() => onMoveToTrash(post.id)}
        >
          <Trash2 className="h-4 w-4 text-foreground/60" />
          削除
        </Button>
      </div>
    </article>
  );
}
