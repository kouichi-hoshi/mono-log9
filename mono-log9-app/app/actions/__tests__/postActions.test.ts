import {
  createPostAction,
  deleteTrashPostsAction,
  emptyTrashAction,
  listPostsAction,
  moveToTrashAction,
  restoreFromTrashAction,
  setFavoriteAction,
  updatePostAction,
} from "@/app/actions/postActions";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { ensureActorUserFromSession } from "@/lib/auth/actorUser";
import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import { PostRepositoryError } from "@/lib/posts/errors";
import { getStubPostsEnabled } from "@/lib/env";
import { getActorPostRepository, postRepository } from "@/lib/posts/postRepository";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/lib/auth/actorUser", () => ({
  ensureActorUserFromSession: jest.fn(),
}));

jest.mock("@/lib/env", () => ({
  getStubPostsEnabled: jest.fn(() => true),
}));

jest.mock("@/lib/posts/postRepository", () => ({
  getActorPostRepository: jest.fn(),
  postRepository: {
    listPosts: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    setFavorite: jest.fn(),
    moveToTrash: jest.fn(),
    restoreFromTrash: jest.fn(),
    deleteTrashPosts: jest.fn(),
    emptyTrash: jest.fn(),
  },
}));

type PostRepositoryMock = jest.Mocked<typeof postRepository>;
const POST_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_POST_ID = "550e8400-e29b-41d4-a716-446655440001";
const TRASH_POST_ID = "550e8400-e29b-41d4-a716-446655440099";

function getRepositoryMock() {
  return postRepository as PostRepositoryMock;
}

function getActorRepositoryMock() {
  return getActorPostRepository as jest.MockedFunction<typeof getActorPostRepository>;
}

describe("postActions", () => {
  const originalE2ETestMode = process.env.E2E_TEST_MODE;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.E2E_TEST_MODE = originalE2ETestMode;
    (getStubPostsEnabled as jest.Mock).mockReturnValue(true);
    (auth as jest.Mock).mockResolvedValue({
      user: { googleSub: "google-sub-1" },
    });
    (ensureActorUserFromSession as jest.Mock).mockResolvedValue(POST_ID);
    getActorRepositoryMock().mockReturnValue(getRepositoryMock());
    (headers as jest.Mock).mockResolvedValue(new Headers());
  });

  afterAll(() => {
    process.env.E2E_TEST_MODE = originalE2ETestMode;
  });

  it("returns ok result for listPostsAction", async () => {
    getRepositoryMock().listPosts.mockResolvedValue({
      items: [],
      hasNext: false,
      nextCursor: null,
    });

    const result = await listPostsAction({ view: "memo", favoriteOnly: false, limit: 10 });

    expect(getRepositoryMock().listPosts).toHaveBeenCalledWith({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        items: [],
        hasNext: false,
        nextCursor: null,
      },
    });
  });

  it("returns serialized error for repository errors", async () => {
    getRepositoryMock().setFavorite.mockRejectedValue(
      new PostRepositoryError("NOT_FOUND", "対象が見つかりません")
    );

    const result = await setFavoriteAction({ postId: OTHER_POST_ID, favorite: true });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "対象が見つかりません",
      },
    });
  });

  it("exposes all write actions", async () => {
    getRepositoryMock().createPost.mockResolvedValue({
      id: POST_ID,
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("a"),
      contentText: "a",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().updatePost.mockResolvedValue({
      id: POST_ID,
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("b"),
      contentText: "b",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().setFavorite.mockResolvedValue({
      postId: POST_ID,
      favorite: true,
    });
    getRepositoryMock().moveToTrash.mockResolvedValue(undefined);
    getRepositoryMock().restoreFromTrash.mockResolvedValue(undefined);
    getRepositoryMock().deleteTrashPosts.mockResolvedValue({ deletedPostIds: [TRASH_POST_ID] });
    getRepositoryMock().emptyTrash.mockResolvedValue({ deletedCount: 3 });

    await expect(
      createPostAction({ mode: "memo", content: createDocFromPlainText("a") })
    ).resolves.toEqual({
      ok: true,
      data: {
        id: POST_ID,
        mode: "memo",
        title: undefined,
        content: createDocFromPlainText("a"),
        contentText: "a",
        favorite: false,
        createdAt: "2026-02-16 10:00",
      },
    });
    expect(getRepositoryMock().createPost).toHaveBeenCalledWith({
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("a"),
      contentText: "a",
    });
    await expect(
      updatePostAction({ postId: POST_ID, title: "  b  ", content: createDocFromPlainText("b") })
    ).resolves.toEqual({
      ok: true,
      data: {
        id: POST_ID,
        mode: "memo",
        title: undefined,
        content: createDocFromPlainText("b"),
        contentText: "b",
        favorite: false,
        createdAt: "2026-02-16 10:00",
      },
    });
    expect(getRepositoryMock().updatePost).toHaveBeenCalledWith({
      postId: POST_ID,
      title: "b",
      content: createDocFromPlainText("b"),
    });
    await expect(setFavoriteAction({ postId: POST_ID, favorite: true })).resolves.toEqual({
      ok: true,
      data: { postId: POST_ID, favorite: true },
    });
    await expect(moveToTrashAction({ postId: POST_ID })).resolves.toEqual({
      ok: true,
      data: null,
    });
    await expect(restoreFromTrashAction({ postId: POST_ID })).resolves.toEqual({
      ok: true,
      data: null,
    });
    await expect(deleteTrashPostsAction({ postIds: [TRASH_POST_ID] })).resolves.toEqual({
      ok: true,
      data: { deletedPostIds: [TRASH_POST_ID] },
    });
    await expect(emptyTrashAction()).resolves.toEqual({
      ok: true,
      data: { deletedCount: 3 },
    });
  });

  it("returns VALIDATION_ERROR when create input schema is invalid before repository", async () => {
    const result = await createPostAction({
      mode: "note",
      content: {
        type: "doc",
        content: [{ type: "text", text: "invalid root child" }],
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().createPost).not.toHaveBeenCalled();
  });

  it("accepts rich note content with allowed nodes and marks", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "見出し" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "太字", marks: [{ type: "bold" }] },
            { type: "text", text: "と" },
            {
              type: "text",
              text: "リンク",
              marks: [{ type: "link", attrs: { href: "https://example.com/" } }],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "引用本文" }],
            },
          ],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "項目1" }] }],
            },
          ],
        },
      ],
    };

    getRepositoryMock().createPost.mockResolvedValue({
      id: OTHER_POST_ID,
      mode: "note",
      title: "タイトル",
      content,
      contentText: extractContentText(content, "note"),
      favorite: false,
      createdAt: "2026-02-18 10:00",
    });

    const result = await createPostAction({
      mode: "note",
      title: " タイトル ",
      content,
    });

    expect(result).toMatchObject({ ok: true });
    expect(getRepositoryMock().createPost).toHaveBeenCalledWith({
      mode: "note",
      title: "タイトル",
      content,
      contentText: extractContentText(content, "note"),
    });
  });

  it("returns VALIDATION_ERROR for disallowed mark", async () => {
    const result = await createPostAction({
      mode: "note",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "italic", marks: [{ type: "italic" }] }],
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().createPost).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when update postId format is invalid", async () => {
    const result = await updatePostAction({
      postId: "invalid",
      content: createDocFromPlainText("更新本文"),
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().updatePost).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR when update title exceeds max length", async () => {
    const result = await updatePostAction({
      postId: POST_ID,
      title: "a".repeat(101),
      content: createDocFromPlainText("更新本文"),
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().updatePost).not.toHaveBeenCalled();
  });

  it("returns INTERNAL_ERROR for unknown exceptions", async () => {
    getRepositoryMock().listPosts.mockRejectedValue(new Error("unexpected"));

    const result = await listPostsAction({ view: "memo", favoriteOnly: false, limit: 10 });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "エラーが発生しました",
      },
    });
  });

  it("fails listPosts only once when e2e scenario header is enabled", async () => {
    process.env.E2E_TEST_MODE = "true";
    (headers as jest.Mock).mockResolvedValue(
      new Headers({
        "x-e2e-scenario": "list-initial-fail-once",
      })
    );
    getRepositoryMock().listPosts.mockResolvedValue({
      items: [],
      hasNext: false,
      nextCursor: null,
    });

    const first = await listPostsAction({ view: "memo", favoriteOnly: false, limit: 10 });
    const second = await listPostsAction({ view: "memo", favoriteOnly: false, limit: 10 });

    expect(first).toEqual({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "エラーが発生しました",
      },
    });
    expect(second).toEqual({
      ok: true,
      data: {
        items: [],
        hasNext: false,
        nextCursor: null,
      },
    });
    expect(getRepositoryMock().listPosts).toHaveBeenCalledTimes(1);
  });

  it("returns VALIDATION_ERROR when list limit exceeds max", async () => {
    const result = await listPostsAction({
      view: "memo",
      favoriteOnly: false,
      limit: 51,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().listPosts).not.toHaveBeenCalled();
  });

  it("returns VALIDATION_ERROR for non-uuid postId in db mode", async () => {
    (getStubPostsEnabled as jest.Mock).mockReturnValue(false);

    const result = await updatePostAction({
      postId: "post-100",
      content: createDocFromPlainText("更新本文"),
      expectedActorUserId: POST_ID,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });
    expect(getRepositoryMock().updatePost).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED before VALIDATION_ERROR when not logged in (db mode)", async () => {
    (getStubPostsEnabled as jest.Mock).mockReturnValue(false);
    (auth as jest.Mock).mockResolvedValue(null);
    (ensureActorUserFromSession as jest.Mock).mockImplementation(() => {
      throw new PostRepositoryError("UNAUTHORIZED", "ログインが必要です");
    });

    const result = await updatePostAction({
      postId: "invalid",
      content: createDocFromPlainText("更新本文"),
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });
    expect(getRepositoryMock().updatePost).not.toHaveBeenCalled();
  });

  it("returns UNAUTHORIZED when session has no googleSub in db mode", async () => {
    (getStubPostsEnabled as jest.Mock).mockReturnValue(false);
    (auth as jest.Mock).mockResolvedValue(null);
    (ensureActorUserFromSession as jest.Mock).mockImplementation(() => {
      throw new PostRepositoryError("UNAUTHORIZED", "ログインが必要です");
    });

    const result = await listPostsAction({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });
    expect(getRepositoryMock().listPosts).not.toHaveBeenCalled();
  });
});
