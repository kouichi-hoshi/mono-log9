import { parseDisplayJstDateTimeToEpochMs } from "@/lib/posts/dateTime";
import type { PostRecord } from "@/lib/posts/types";

function compareByIdDesc(a: Pick<PostRecord, "id">, b: Pick<PostRecord, "id">): number {
  return b.id.localeCompare(a.id);
}

function resolveEpochMs(value: number | undefined, fallbackDisplayValue: string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof fallbackDisplayValue !== "string") {
    return null;
  }
  return parseDisplayJstDateTimeToEpochMs(fallbackDisplayValue);
}

export function comparePostsByCreatedAtDesc(a: PostRecord, b: PostRecord): number {
  const aEpoch = resolveEpochMs(a.createdAtEpochMs, a.createdAt);
  const bEpoch = resolveEpochMs(b.createdAtEpochMs, b.createdAt);

  if (aEpoch !== null && bEpoch !== null && aEpoch !== bEpoch) {
    return bEpoch - aEpoch;
  }

  if (a.createdAt !== b.createdAt) {
    return b.createdAt.localeCompare(a.createdAt);
  }

  return compareByIdDesc(a, b);
}

export function comparePostsByTrashedAtDesc(a: PostRecord, b: PostRecord): number {
  const aEpoch = resolveEpochMs(a.trashedAtEpochMs, a.trashedAt);
  const bEpoch = resolveEpochMs(b.trashedAtEpochMs, b.trashedAt);

  if (aEpoch !== null && bEpoch !== null && aEpoch !== bEpoch) {
    return bEpoch - aEpoch;
  }

  const aDisplay = a.trashedAt ?? "";
  const bDisplay = b.trashedAt ?? "";
  if (aDisplay !== bDisplay) {
    return bDisplay.localeCompare(aDisplay);
  }

  return compareByIdDesc(a, b);
}
