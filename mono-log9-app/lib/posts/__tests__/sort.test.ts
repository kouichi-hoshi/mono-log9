import type { PostRecord } from "@/lib/posts/types";
import {
  comparePostsByCreatedAtDesc,
  comparePostsByTrashedAtDesc,
} from "@/lib/posts/sort";

type SortablePostRecord = PostRecord & {
  createdAtEpochMs?: number;
  trashedAtEpochMs?: number;
};

function makeMemoPost(input: {
  id: string;
  createdAt: string;
  createdAtEpochMs?: number;
}): SortablePostRecord {
  return {
    id: input.id,
    mode: "memo",
    content: { type: "doc", content: [] },
    contentText: "",
    favorite: false,
    createdAt: input.createdAt,
    createdAtEpochMs: input.createdAtEpochMs,
  };
}

function makeTrashPost(input: {
  id: string;
  createdAt: string;
  trashedAt: string;
  trashedAtEpochMs?: number;
}): SortablePostRecord {
  return {
    id: input.id,
    mode: "memo",
    content: { type: "doc", content: [] },
    contentText: "",
    favorite: false,
    createdAt: input.createdAt,
    trashedAt: input.trashedAt,
    trashedAtEpochMs: input.trashedAtEpochMs,
  };
}

describe("posts sort", () => {
  it("prefers createdAtEpochMs over display datetime when sorting", () => {
    const older: SortablePostRecord = makeMemoPost({
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      createdAt: "2026-02-23 10:00",
      createdAtEpochMs: 1708682399000,
    });
    const newer: SortablePostRecord = makeMemoPost({
      id: "00000000-0000-4000-8000-000000000000",
      createdAt: "2026-02-23 10:00",
      createdAtEpochMs: 1708682400000,
    });

    const sorted = [older, newer].sort(comparePostsByCreatedAtDesc);
    expect(sorted[0].id).toBe(newer.id);
  });

  it("uses id DESC tie-break for createdAt when epoch is equal", () => {
    const a: SortablePostRecord = makeMemoPost({
      id: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-02-23 10:00",
      createdAtEpochMs: 1708682400000,
    });
    const b: SortablePostRecord = makeMemoPost({
      id: "00000000-0000-4000-8000-000000000002",
      createdAt: "2026-02-23 10:00",
      createdAtEpochMs: 1708682400000,
    });

    const sorted = [a, b].sort(comparePostsByCreatedAtDesc);
    expect(sorted[0].id).toBe(b.id);
  });

  it("falls back to createdAt string comparison when epoch is absent", () => {
    const older: SortablePostRecord = makeMemoPost({
      id: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-02-23 09:59",
    });
    const newer: SortablePostRecord = makeMemoPost({
      id: "00000000-0000-4000-8000-000000000000",
      createdAt: "2026-02-23 10:00",
    });

    const sorted = [older, newer].sort(comparePostsByCreatedAtDesc);
    expect(sorted[0].id).toBe(newer.id);
  });

  it("prefers trashedAtEpochMs over display datetime when sorting trash", () => {
    const older: SortablePostRecord = makeTrashPost({
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      createdAt: "2026-02-20 10:00",
      trashedAt: "2026-02-23 10:00",
      trashedAtEpochMs: 1708682399000,
    });
    const newer: SortablePostRecord = makeTrashPost({
      id: "00000000-0000-4000-8000-000000000000",
      createdAt: "2026-02-20 10:00",
      trashedAt: "2026-02-23 10:00",
      trashedAtEpochMs: 1708682400000,
    });

    const sorted = [older, newer].sort(comparePostsByTrashedAtDesc);
    expect(sorted[0].id).toBe(newer.id);
  });

  it("falls back to trashedAt string comparison when epoch is absent", () => {
    const older: SortablePostRecord = makeTrashPost({
      id: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-02-20 10:00",
      trashedAt: "2026-02-23 09:59",
    });
    const newer: SortablePostRecord = makeTrashPost({
      id: "00000000-0000-4000-8000-000000000000",
      createdAt: "2026-02-20 10:00",
      trashedAt: "2026-02-23 10:00",
    });

    const sorted = [older, newer].sort(comparePostsByTrashedAtDesc);
    expect(sorted[0].id).toBe(newer.id);
  });
});
