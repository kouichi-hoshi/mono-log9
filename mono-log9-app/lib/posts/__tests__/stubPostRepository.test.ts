import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import { decodePostsCursor, encodePostsCursor } from "@/lib/posts/cursor";
import {
  __resetStubPostRepositoryForTests,
  stubPostRepository,
} from "@/lib/posts/repositories/stubPostRepository";

describe("stubPostRepository", () => {
  const memo001 = "11111111-1111-4111-8111-111111111001";
  const memo012 = "11111111-1111-4111-8111-111111111012";
  const memo013 = "11111111-1111-4111-8111-111111111013";
  const memo014 = "11111111-1111-4111-8111-111111111014";
  const trash001 = "22222222-2222-4222-8222-222222222001";
  const trash002 = "22222222-2222-4222-8222-222222222002";
  const trash003 = "22222222-2222-4222-8222-222222222003";
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mutableEnv.NODE_ENV = "development";
    __resetStubPostRepositoryForTests();
  });

  afterAll(() => {
    mutableEnv.NODE_ENV = originalNodeEnv;
  });

  it("rejects access outside development", async () => {
    mutableEnv.NODE_ENV = "test";

    await expect(
      stubPostRepository.listPosts({ view: "memo", favoriteOnly: false, limit: 10 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists memo posts with cursor pagination", async () => {
    const first = await stubPostRepository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
    });

    expect(first.items).toHaveLength(10);
    expect(first.hasNext).toBe(true);
    expect(first.nextCursor).toBeTruthy();
    expect(first.items[0]).toHaveProperty("createdAtEpochMs");
    expect(typeof (first.items[0] as { createdAtEpochMs?: unknown }).createdAtEpochMs).toBe("number");
    expect(decodePostsCursor(first.nextCursor as string)).toEqual({
      v: 1,
      t: "2026-02-02T10:27:00.000Z",
      id: memo012,
    });

    const second = await stubPostRepository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
      cursor: first.nextCursor ?? undefined,
    });

    expect(second.items).toHaveLength(2);
    expect(second.hasNext).toBe(false);
    expect(second.nextCursor).toBeNull();
    expect(second.items[0].id).toBe(memo013);
    expect(second.items[1].id).toBe(memo014);
  });

  it("returns trashedAtEpochMs in trash list", async () => {
    const trash = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 10,
    });

    expect(trash.items).toHaveLength(3);
    expect(trash.items[0]).toHaveProperty("trashedAtEpochMs");
    expect(typeof (trash.items[0] as { trashedAtEpochMs?: unknown }).trashedAtEpochMs).toBe("number");
  });

  it("ignores favoriteOnly in trash view", async () => {
    const withoutFavorite = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 10,
    });
    const withFavorite = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: true,
      limit: 10,
    });

    expect(withoutFavorite.items.map((post) => post.id)).toEqual([
      trash001,
      trash002,
      trash003,
    ]);
    expect(withFavorite.items.map((post) => post.id)).toEqual([
      trash001,
      trash002,
      trash003,
    ]);
  });

  it("returns INVALID_CURSOR for empty, unknown, and condition-mismatch cursors", async () => {
    await expect(
      stubPostRepository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
        cursor: "   ",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });

    await expect(
      stubPostRepository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
        cursor: "invalid-cursor",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });

    const memoCursor = encodePostsCursor({
      v: 1,
      t: "2026-02-08T00:12:00.000Z",
      id: memo001,
    });
    await expect(
      stubPostRepository.listPosts({
        view: "note",
        favoriteOnly: false,
        limit: 10,
        cursor: memoCursor,
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
  });

  it("returns VALIDATION_ERROR when limit is out of allowed range", async () => {
    await expect(
      stubPostRepository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 0,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      stubPostRepository.listPosts({
        view: "memo",
        favoriteOnly: false,
        limit: 51,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("creates posts non-idempotently", async () => {
    const firstContent = createDocFromPlainText("新規メモ");
    const first = await stubPostRepository.createPost({
      mode: "memo",
      content: firstContent,
      contentText: extractContentText(firstContent, "memo"),
    });
    const secondContent = createDocFromPlainText("新規メモ");
    const second = await stubPostRepository.createPost({
      mode: "memo",
      content: secondContent,
      contentText: extractContentText(secondContent, "memo"),
    });

    expect(first.id).not.toBe(second.id);
    expect(first.contentText).toBe("新規メモ");
    expect(second.contentText).toBe("新規メモ");
    expect(first).toHaveProperty("createdAtEpochMs");
    expect(typeof (first as { createdAtEpochMs?: unknown }).createdAtEpochMs).toBe("number");
  });

  it("enforces validation and NOT_FOUND on write operations", async () => {
    await expect(
      stubPostRepository.createPost({
        mode: "memo",
        content: createDocFromPlainText("x"),
        contentText: "y",
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      stubPostRepository.updatePost({
        postId: "invalid",
        content: createDocFromPlainText("x"),
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await expect(
      stubPostRepository.updatePost({
        postId: "550e8400-e29b-41d4-a716-446655449999",
        content: createDocFromPlainText("x"),
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      stubPostRepository.setFavorite({
        postId: memo001,
        favorite: "1" as unknown as boolean,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("keeps update and setFavorite idempotent", async () => {
    const before = await stubPostRepository.updatePost({
      postId: memo001,
      content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
      title: undefined,
    });
    const again = await stubPostRepository.updatePost({
      postId: memo001,
      content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
      title: undefined,
    });

    expect(before).toEqual(again);

    const favoriteBefore = await stubPostRepository.setFavorite({
      postId: memo001,
      favorite: false,
    });
    const favoriteAgain = await stubPostRepository.setFavorite({
      postId: memo001,
      favorite: false,
    });

    expect(favoriteBefore).toEqual(favoriteAgain);
  });

  it("updates trashedAt on move/restore with idempotent behavior", async () => {
    await stubPostRepository.moveToTrash({ postId: memo001 });
    const moved = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });

    const movedItem = moved.items.find((post) => post.id === memo001);
    expect(movedItem?.trashedAt).toBeDefined();
    expect(movedItem).toHaveProperty("trashedAtEpochMs");
    expect(typeof (movedItem as { trashedAtEpochMs?: unknown } | undefined)?.trashedAtEpochMs).toBe(
      "number"
    );

    await stubPostRepository.moveToTrash({ postId: memo001 });
    const movedAgain = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });
    const movedAgainItem = movedAgain.items.find((post) => post.id === memo001);
    expect(movedAgainItem?.trashedAt).toBe(movedItem?.trashedAt);

    await stubPostRepository.restoreFromTrash({ postId: memo001 });
    const active = await stubPostRepository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 20,
    });
    const restored = active.items.find((post) => post.id === memo001);
    expect(restored?.trashedAt).toBeUndefined();

    await expect(stubPostRepository.restoreFromTrash({ postId: memo001 })).resolves.toBeUndefined();
  });

  it("deletes selected trash posts only", async () => {
    const result = await stubPostRepository.deleteTrashPosts({
      postIds: [trash001, trash003],
    });

    expect(result.deletedPostIds).toEqual([trash001, trash003]);

    const trash = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });
    expect(trash.items.map((post) => post.id)).toEqual([trash002]);
  });

  it("returns NOT_FOUND when deleting non-trash post ids", async () => {
    await expect(
      stubPostRepository.deleteTrashPosts({
        postIds: [memo001],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("empties trash and returns deleted count", async () => {
    const result = await stubPostRepository.emptyTrash();
    expect(result).toEqual({ deletedCount: 3 });

    const trash = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });
    expect(trash.items).toHaveLength(0);
  });
});
