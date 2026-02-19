import type { PostContent } from "@/lib/posts/types";
import { extractContentText } from "@/lib/posts/content";

function isEmptyDoc(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const doc = value as { type?: unknown; content?: unknown };
  if (doc.type !== "doc") {
    return false;
  }

  if (typeof doc.content === "undefined") {
    return true;
  }

  return Array.isArray(doc.content) && doc.content.length === 0;
}

function normalizeNoteContent(content: PostContent | null | undefined): PostContent | null {
  if (!content || isEmptyDoc(content)) {
    return null;
  }

  if (extractContentText(content, "note").length === 0) {
    return null;
  }

  return content;
}

function normalizeNoteTitle(title: string | undefined): string {
  return title?.trim() ?? "";
}

export function isMemoDirty(initialValue: string, currentValue: string): boolean {
  return initialValue !== currentValue;
}

export function isNoteDirty(
  initial: { title?: string; content: PostContent | null | undefined },
  current: { title?: string; content: PostContent | null | undefined }
): boolean {
  const initialTitle = normalizeNoteTitle(initial.title);
  const currentTitle = normalizeNoteTitle(current.title);
  if (initialTitle !== currentTitle) {
    return true;
  }

  const initialContent = normalizeNoteContent(initial.content);
  const currentContent = normalizeNoteContent(current.content);

  return JSON.stringify(initialContent) !== JSON.stringify(currentContent);
}
