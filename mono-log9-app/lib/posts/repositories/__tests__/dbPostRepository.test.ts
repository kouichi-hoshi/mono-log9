import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import { encodePostsCursor } from "@/lib/posts/cursor";
import { getPrismaClient } from "@/lib/db/prisma";
import { createDbPostRepository } from "@/lib/posts/repositories/dbPostRepository";

jest.mock("@/lib/db/prisma", () => ({
  getPrismaClient: jest.fn(),
}));

describe("dbPostRepository", () => {
  const actorUserId = "550e8400-e29b-41d4-a716-446655440123";
  const content = createDocFromPlainText("メモ本文");

  function makeRow(
    id: string,
    createdAt: string,
    overrides: Partial<{
      mode: "memo" | "note";
      title: string | null;
      contentText: string;
      favorite: boolean;
      trashedAt: Date | null;
      status: "active" | "trashed";
    }> = {}
  ) {
    return {
      id,
      mode: overrides.mode ?? "memo",
      title: overrides.title ?? null,
      content,
      contentText: overrides.contentText ?? "メモ本文",
      favorite: overrides.favorite ?? false,
      createdAt: new Date(createdAt),
      trashedAt: overrides.trashedAt ?? null,
      status: overrides.status ?? "active",
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns INVALID_CURSOR for legacy cursor", async () => {
    const findFirst = jest.fn();
    const findMany = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    await expect(
      repository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
        cursor: "post-001",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
    expect(findFirst).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns INVALID_CURSOR for v1 cursor with non-uuid id", async () => {
    const findFirst = jest.fn();
    const findMany = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    await expect(
      repository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
        cursor: encodePostsCursor({
          v: 1,
          t: "2026-02-23T10:00:00.000Z",
          id: "post-001",
        }),
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
    expect(findFirst).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("maps prisma known constraint errors to VALIDATION_ERROR", async () => {
    const create = jest.fn().mockRejectedValue({ code: "P2002" });
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { create },
    });
    const repository = createDbPostRepository({ actorUserId });

    await expect(
      repository.createPost({
        mode: "memo",
        content,
        contentText: extractContentText(content, "memo"),
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("returns v1 nextCursor in db list paging", async () => {
    const findMany = jest.fn().mockResolvedValue([
      makeRow("550e8400-e29b-41d4-a716-446655440001", "2026-02-23T10:00:00.000Z"),
      makeRow("550e8400-e29b-41d4-a716-446655440002", "2026-02-23T09:00:00.000Z"),
      makeRow("550e8400-e29b-41d4-a716-446655440003", "2026-02-23T08:00:00.000Z"),
    ]);
    const findFirst = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    const result = await repository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(result.items[0]).toHaveProperty("createdAtEpochMs");
    expect(result.items[1]).toHaveProperty("createdAtEpochMs");
    const decoded = JSON.parse(
      Buffer.from(result.nextCursor as string, "base64url").toString("utf8")
    ) as { v: number; t: string; id: string };
    expect(decoded).toEqual({
      v: 1,
      t: "2026-02-23T09:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440002",
    });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("includes trashedAtEpochMs in trash list results", async () => {
    const findMany = jest.fn().mockResolvedValue([
      makeRow("550e8400-e29b-41d4-a716-446655440001", "2026-02-20T10:00:00.000Z", {
        status: "trashed",
        trashedAt: new Date("2026-02-23T10:00:00.000Z"),
      }),
      makeRow("550e8400-e29b-41d4-a716-446655440002", "2026-02-20T09:00:00.000Z", {
        status: "trashed",
        trashedAt: new Date("2026-02-23T09:00:00.000Z"),
      }),
    ]);
    const findFirst = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    const result = await repository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 10,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toHaveProperty("trashedAtEpochMs");
    expect(result.items[1]).toHaveProperty("trashedAtEpochMs");
  });

  it("continues paging with v1 cursor in db list", async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValue(makeRow("550e8400-e29b-41d4-a716-446655440002", "2026-02-23T09:00:00.000Z"));
    const findMany = jest
      .fn()
      .mockResolvedValue([
        makeRow("550e8400-e29b-41d4-a716-446655440003", "2026-02-23T08:00:00.000Z"),
      ]);
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    const result = await repository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 2,
      cursor: encodePostsCursor({
        v: 1,
        t: "2026-02-23T09:00:00.000Z",
        id: "550e8400-e29b-41d4-a716-446655440002",
      }),
    });

    expect(result.items.map((item) => item.id)).toEqual([
      "550e8400-e29b-41d4-a716-446655440003",
    ]);
    expect(result.hasNext).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("returns VALIDATION_ERROR for invalid limit before cursor validation", async () => {
    const findFirst = jest.fn();
    const findMany = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, findMany },
    });
    const repository = createDbPostRepository({ actorUserId });

    await expect(
      repository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 0,
        cursor: "post-001",
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(findFirst).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns compact favorite result without update when favorite is unchanged", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });
    const update = jest.fn();
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, update },
    });
    const repository = createDbPostRepository({ actorUserId });

    const result = await repository.setFavorite({
      postId: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });

    expect(result).toEqual({
      postId: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        authorId: actorUserId,
      },
      select: {
        id: true,
        favorite: true,
      },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates favorite and returns compact favorite result", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      favorite: false,
    });
    const update = jest.fn().mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });
    (getPrismaClient as jest.Mock).mockResolvedValue({
      post: { findFirst, update },
    });
    const repository = createDbPostRepository({ actorUserId });

    const result = await repository.setFavorite({
      postId: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });

    expect(result).toEqual({
      postId: "550e8400-e29b-41d4-a716-446655440001",
      favorite: true,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "550e8400-e29b-41d4-a716-446655440001" },
      data: { favorite: true },
      select: {
        id: true,
        favorite: true,
      },
    });
  });
});
