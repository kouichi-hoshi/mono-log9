import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import {
  __resetStubPostRepositoryForTests,
  stubPostRepository,
} from "@/lib/posts/repositories/stubPostRepository";

describe("stubPostRepository", () => {
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
    expect(first.nextCursor).toBe("post-012");

    const second = await stubPostRepository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
      cursor: first.nextCursor ?? undefined,
    });

    expect(second.items).toHaveLength(2);
    expect(second.hasNext).toBe(false);
    expect(second.nextCursor).toBeNull();
    expect(second.items[0].id).toBe("post-013");
    expect(second.items[1].id).toBe("post-014");
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
      "trash-001",
      "trash-002",
      "trash-003",
    ]);
    expect(withFavorite.items.map((post) => post.id)).toEqual([
      "trash-001",
      "trash-002",
      "trash-003",
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
        cursor: "post-999999",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });

    await expect(
      stubPostRepository.listPosts({
        view: "note",
        favoriteOnly: false,
        limit: 10,
        cursor: "post-001",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
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
        postId: "post-999",
        content: createDocFromPlainText("x"),
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      stubPostRepository.setFavorite({
        postId: "post-001",
        favorite: "1" as unknown as boolean,
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("keeps update and setFavorite idempotent", async () => {
    const before = await stubPostRepository.updatePost({
      postId: "post-001",
      content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
      title: undefined,
    });
    const again = await stubPostRepository.updatePost({
      postId: "post-001",
      content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
      title: undefined,
    });

    expect(before).toEqual(again);

    const favoriteBefore = await stubPostRepository.setFavorite({
      postId: "post-001",
      favorite: false,
    });
    const favoriteAgain = await stubPostRepository.setFavorite({
      postId: "post-001",
      favorite: false,
    });

    expect(favoriteBefore).toEqual(favoriteAgain);
  });

  it("updates trashedAt on move/restore with idempotent behavior", async () => {
    await stubPostRepository.moveToTrash({ postId: "post-001" });
    const moved = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });

    const movedItem = moved.items.find((post) => post.id === "post-001");
    expect(movedItem?.trashedAt).toBeDefined();

    await stubPostRepository.moveToTrash({ postId: "post-001" });
    const movedAgain = await stubPostRepository.listPosts({
      view: "trash",
      favoriteOnly: false,
      limit: 20,
    });
    const movedAgainItem = movedAgain.items.find((post) => post.id === "post-001");
    expect(movedAgainItem?.trashedAt).toBe(movedItem?.trashedAt);

    await stubPostRepository.restoreFromTrash({ postId: "post-001" });
    const active = await stubPostRepository.listPosts({
      view: "memo",
      favoriteOnly: false,
      limit: 20,
    });
    const restored = active.items.find((post) => post.id === "post-001");
    expect(restored?.trashedAt).toBeUndefined();

    await expect(stubPostRepository.restoreFromTrash({ postId: "post-001" })).resolves.toBeUndefined();
  });
});
