import type { PostsListCondition } from "@/lib/posts/queryKeys";

const SCROLL_KEY_PREFIX = "mono-log:scroll:v1";
const HISTORY_ENTRY_ID_KEY = "__mono_log_scroll_entry_id__";

export function getScrollStorageKey(condition: PostsListCondition): string {
  return `${SCROLL_KEY_PREFIX}:${condition.view}:${condition.favoriteOnly ? "1" : "0"}`;
}

function createHistoryEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getHistoryEntryId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const currentState = window.history.state;
  if (
    currentState &&
    typeof currentState === "object" &&
    typeof (currentState as Record<string, unknown>)[HISTORY_ENTRY_ID_KEY] === "string"
  ) {
    return (currentState as Record<string, string>)[HISTORY_ENTRY_ID_KEY];
  }

  try {
    const nextId = createHistoryEntryId();
    const nextState =
      currentState && typeof currentState === "object"
        ? { ...(currentState as Record<string, unknown>), [HISTORY_ENTRY_ID_KEY]: nextId }
        : { [HISTORY_ENTRY_ID_KEY]: nextId };
    window.history.replaceState(nextState, "", window.location.href);
    return nextId;
  } catch {
    return null;
  }
}

function getEntryScrollStorageKey(condition: PostsListCondition, entryId: string): string {
  return `${getScrollStorageKey(condition)}:${entryId}`;
}

export function saveScrollPosition(condition: PostsListCondition): void {
  if (typeof window === "undefined") {
    return;
  }

  const value = `${window.scrollY}`;
  window.sessionStorage.setItem(getScrollStorageKey(condition), value);

  const entryId = getHistoryEntryId();
  if (!entryId) {
    return;
  }

  window.sessionStorage.setItem(getEntryScrollStorageKey(condition, entryId), value);
}

export function readScrollPosition(condition: PostsListCondition): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const parseScroll = (raw: string | null): number | null => {
    if (raw === null) {
      return null;
    }

    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  };

  const entryId = getHistoryEntryId();
  if (entryId) {
    const entryParsed = parseScroll(
      window.sessionStorage.getItem(getEntryScrollStorageKey(condition, entryId))
    );
    if (entryParsed !== null) {
      return entryParsed;
    }
  }

  return parseScroll(window.sessionStorage.getItem(getScrollStorageKey(condition)));
}

export function restoreScrollPosition(
  condition: PostsListCondition,
  onComplete?: () => void
): () => void {
  if (typeof window === "undefined") {
    onComplete?.();
    return () => {};
  }

  const top = readScrollPosition(condition);
  if (top === null) {
    onComplete?.();
    return () => {};
  }

  const frameId = window.requestAnimationFrame(() => {
    window.scrollTo({ top, left: 0, behavior: "auto" });
    onComplete?.();
  });

  return () => {
    window.cancelAnimationFrame(frameId);
  };
}
