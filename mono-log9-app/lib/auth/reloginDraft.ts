import type { PostContent } from "@/lib/posts/types";

export type ReloginNoteDraft = {
  title: string;
  contentJson: PostContent | null;
  plainText: string;
};

export type ReloginDraftPayload = {
  query: string;
  memoDraft: string;
  editingMemoPostId: string | null;
  editingMemoValue: string;
  noteDraft: ReloginNoteDraft | null;
};

type StoredReloginDraft = ReloginDraftPayload & {
  version: 1;
  savedAt: number;
};

const RELOGIN_DRAFT_KEY = "mono-log:relogin-draft:v1";
const RELOGIN_DRAFT_TTL_MS = 30 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStoredReloginDraft(raw: string): StoredReloginDraft | null {
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    if (
      parsed.version !== 1 ||
      typeof parsed.savedAt !== "number" ||
      typeof parsed.query !== "string" ||
      typeof parsed.memoDraft !== "string" ||
      !(typeof parsed.editingMemoPostId === "string" || parsed.editingMemoPostId === null) ||
      typeof parsed.editingMemoValue !== "string"
    ) {
      return null;
    }

    const noteDraft = parsed.noteDraft;
    if (noteDraft !== null) {
      if (!isRecord(noteDraft)) {
        return null;
      }

      if (
        typeof noteDraft.title !== "string" ||
        !(isRecord(noteDraft.contentJson) || noteDraft.contentJson === null) ||
        typeof noteDraft.plainText !== "string"
      ) {
        return null;
      }
    }

    return parsed as StoredReloginDraft;
  } catch {
    return null;
  }
}

export function saveReloginDraft(payload: ReloginDraftPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  const data: StoredReloginDraft = {
    ...payload,
    version: 1,
    savedAt: Date.now(),
  };

  window.sessionStorage.setItem(RELOGIN_DRAFT_KEY, JSON.stringify(data));
}

export function loadReloginDraft(): ReloginDraftPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(RELOGIN_DRAFT_KEY);
  if (!raw) {
    return null;
  }

  const parsed = parseStoredReloginDraft(raw);
  if (!parsed) {
    window.sessionStorage.removeItem(RELOGIN_DRAFT_KEY);
    return null;
  }

  if (Date.now() - parsed.savedAt > RELOGIN_DRAFT_TTL_MS) {
    window.sessionStorage.removeItem(RELOGIN_DRAFT_KEY);
    return null;
  }

  return {
    query: parsed.query,
    memoDraft: parsed.memoDraft,
    editingMemoPostId: parsed.editingMemoPostId,
    editingMemoValue: parsed.editingMemoValue,
    noteDraft: parsed.noteDraft,
  };
}

export function clearReloginDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(RELOGIN_DRAFT_KEY);
}
