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
import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import { PostRepositoryError } from "@/lib/posts/errors";
import { postRepository } from "@/lib/posts/postRepository";

jest.mock("@/lib/posts/postRepository", () => ({
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

function getRepositoryMock() {
  return postRepository as PostRepositoryMock;
}

describe("postActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    const result = await setFavoriteAction({ postId: "post-999", favorite: true });

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
      id: "post-100",
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("a"),
      contentText: "a",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().updatePost.mockResolvedValue({
      id: "post-100",
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("b"),
      contentText: "b",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().moveToTrash.mockResolvedValue(undefined);
    getRepositoryMock().restoreFromTrash.mockResolvedValue(undefined);
    getRepositoryMock().deleteTrashPosts.mockResolvedValue({ deletedPostIds: ["trash-001"] });
    getRepositoryMock().emptyTrash.mockResolvedValue({ deletedCount: 3 });

    await expect(
      createPostAction({ mode: "memo", content: createDocFromPlainText("a") })
    ).resolves.toMatchObject({ ok: true });
    expect(getRepositoryMock().createPost).toHaveBeenCalledWith({
      mode: "memo",
      title: undefined,
      content: createDocFromPlainText("a"),
      contentText: "a",
    });
    await expect(
      updatePostAction({ postId: "post-100", title: "  b  ", content: createDocFromPlainText("b") })
    ).resolves.toMatchObject({ ok: true });
    expect(getRepositoryMock().updatePost).toHaveBeenCalledWith({
      postId: "post-100",
      title: "b",
      content: createDocFromPlainText("b"),
    });
    await expect(moveToTrashAction({ postId: "post-100" })).resolves.toEqual({
      ok: true,
      data: null,
    });
    await expect(restoreFromTrashAction({ postId: "post-100" })).resolves.toEqual({
      ok: true,
      data: null,
    });
    await expect(deleteTrashPostsAction({ postIds: ["trash-001"] })).resolves.toEqual({
      ok: true,
      data: { deletedPostIds: ["trash-001"] },
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
    } as const;

    getRepositoryMock().createPost.mockResolvedValue({
      id: "post-200",
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
      postId: "post-100",
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
});
