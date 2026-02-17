import {
  createPostAction,
  listPostsAction,
  moveToTrashAction,
  restoreFromTrashAction,
  setFavoriteAction,
  updatePostAction,
} from "@/app/actions/postActions";
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
      content: "a",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().updatePost.mockResolvedValue({
      id: "post-100",
      mode: "memo",
      title: undefined,
      content: "b",
      favorite: false,
      createdAt: "2026-02-16 10:00",
    });
    getRepositoryMock().moveToTrash.mockResolvedValue(undefined);
    getRepositoryMock().restoreFromTrash.mockResolvedValue(undefined);

    await expect(
      createPostAction({ mode: "memo", content: "a" })
    ).resolves.toMatchObject({ ok: true });
    await expect(
      updatePostAction({ postId: "post-100", content: "b" })
    ).resolves.toMatchObject({ ok: true });
    await expect(moveToTrashAction({ postId: "post-100" })).resolves.toEqual({
      ok: true,
      data: null,
    });
    await expect(restoreFromTrashAction({ postId: "post-100" })).resolves.toEqual({
      ok: true,
      data: null,
    });
  });
});
