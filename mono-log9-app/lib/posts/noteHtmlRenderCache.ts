import { toSanitizableHtml } from "@/lib/posts/contentHtml";
import type { PostContent } from "@/lib/posts/types";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

const MAX_CACHE_ENTRIES = 300;

type NoteHtmlCacheInput = {
  postId: string;
  content: PostContent;
  contentText: string;
  title?: string;
};

type CacheEntry = {
  postId: string;
  contentRef: PostContent;
  contentText: string;
  title: string;
  sanitizedHtml: string | null;
};

const cache = new Map<string, CacheEntry>();

function normalizeTitle(title?: string): string {
  return title?.trim() ?? "";
}

function isCacheHit(entry: CacheEntry, input: NoteHtmlCacheInput): boolean {
  return (
    entry.postId === input.postId &&
    entry.contentRef === input.content &&
    entry.contentText === input.contentText &&
    entry.title === normalizeTitle(input.title)
  );
}

function touchCache(key: string, entry: CacheEntry) {
  cache.delete(key);
  cache.set(key, entry);
}

function enforceCacheLimit() {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    cache.delete(oldestKey);
  }
}

export function getCachedNoteHtml(input: NoteHtmlCacheInput): string | null | undefined {
  const entry = cache.get(input.postId);
  if (!entry) {
    return undefined;
  }
  if (!isCacheHit(entry, input)) {
    return undefined;
  }

  touchCache(input.postId, entry);
  return entry.sanitizedHtml;
}

export function computeAndCacheNoteHtml(input: NoteHtmlCacheInput): string | null {
  const html = toSanitizableHtml(input.content);
  const sanitized = html ? sanitizeRichHtml(html) : "";
  const sanitizedHtml = sanitized.length > 0 ? sanitized : null;
  const entry: CacheEntry = {
    postId: input.postId,
    contentRef: input.content,
    contentText: input.contentText,
    title: normalizeTitle(input.title),
    sanitizedHtml,
  };

  touchCache(input.postId, entry);
  enforceCacheLimit();
  return sanitizedHtml;
}

export function clearNoteHtmlRenderCacheForTest() {
  cache.clear();
}
