import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthedScreen from "@/components/authed/AuthedScreen";
import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import type { ListPostsInput, PostRecord } from "@/lib/posts/types";
import { toast } from "sonner";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

jest.mock("@/app/actions/postActions", () => ({
  createPostAction: jest.fn(),
  listPostsAction: jest.fn(),
  moveToTrashAction: jest.fn(),
  restoreFromTrashAction: jest.fn(),
  setFavoriteAction: jest.fn(),
  updatePostAction: jest.fn(),
}));

jest.mock("next/navigation", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  const listeners = new Set<() => void>();
  let currentQuery = "";

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const toQueryString = (href: string) => {
    const url = new URL(href, "http://localhost");
    return url.search.startsWith("?") ? url.search.slice(1) : "";
  };

  const push = jest.fn((href: string) => {
    currentQuery = toQueryString(href);
    notify();
  });

  const replace = jest.fn((href: string) => {
    currentQuery = toQueryString(href);
    notify();
  });

  return {
    useRouter: () => ({
      push,
      replace,
    }),
    useSearchParams: () => {
      React.useSyncExternalStore(
        (listener: () => void) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        () => currentQuery
      );

      return new URLSearchParams(currentQuery);
    },
    __mockNavigation: {
      setQuery(query: string) {
        currentQuery = query;
        notify();
      },
      getPushMock() {
        return push;
      },
      getReplaceMock() {
        return replace;
      },
      reset() {
        currentQuery = "";
        listeners.clear();
        push.mockClear();
        replace.mockClear();
      },
    },
  };
});

type NavigationMock = {
  __mockNavigation: {
    setQuery: (query: string) => void;
    getPushMock: () => jest.Mock;
    getReplaceMock: () => jest.Mock;
    reset: () => void;
  };
};

function getNavigationMock() {
  return jest.requireMock("next/navigation") as NavigationMock;
}

type PostActionsModule = {
  createPostAction: jest.Mock;
  listPostsAction: jest.Mock;
  moveToTrashAction: jest.Mock;
  restoreFromTrashAction: jest.Mock;
  setFavoriteAction: jest.Mock;
  updatePostAction: jest.Mock;
};

function getPostActionsMock() {
  return jest.requireMock("@/app/actions/postActions") as PostActionsModule;
}

const basePosts: PostRecord[] = [
  {
    id: "post-001",
    mode: "memo",
    content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
    contentText: "買い物メモ: 牛乳、パン、トマト",
    createdAt: "2026-02-08 09:12",
    favorite: false,
  },
  {
    id: "post-002",
    mode: "note",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "今日の学び" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "内容" }],
        },
      ],
    },
    contentText: "今日の学び\n\n内容",
    createdAt: "2026-02-07 21:05",
    favorite: true,
  },
  {
    id: "post-003",
    mode: "memo",
    content: createDocFromPlainText("打ち合わせは金曜 14:00 から"),
    contentText: "打ち合わせは金曜 14:00 から",
    createdAt: "2026-02-07 10:45",
    favorite: false,
  },
  {
    id: "trash-001",
    mode: "memo",
    content: createDocFromPlainText("破棄候補メモ: 先週の打ち合わせメモ"),
    contentText: "破棄候補メモ: 先週の打ち合わせメモ",
    createdAt: "2026-01-30 16:20",
    trashedAt: "2026-02-08 12:41",
    favorite: false,
  },
  {
    id: "trash-002",
    mode: "note",
    title: "古い設計メモ",
    content: createDocFromPlainText("旧バージョンの設計メモ"),
    contentText: "旧バージョンの設計メモ",
    createdAt: "2026-01-28 09:10",
    trashedAt: "2026-02-08 10:05",
    favorite: false,
  },
  {
    id: "trash-003",
    mode: "memo",
    content: createDocFromPlainText("削除予定: 一時メモ"),
    contentText: "削除予定: 一時メモ",
    createdAt: "2026-01-25 20:02",
    trashedAt: "2026-02-07 19:55",
    favorite: false,
  },
];

function clonePosts(posts: PostRecord[]): PostRecord[] {
  return posts.map((post) => ({
    ...post,
    content: JSON.parse(JSON.stringify(post.content)),
  }));
}

function sortByCreatedAtDesc(a: PostRecord, b: PostRecord): number {
  if (a.createdAt === b.createdAt) {
    return b.id.localeCompare(a.id);
  }

  return b.createdAt.localeCompare(a.createdAt);
}

function sortByTrashedAtDesc(a: PostRecord, b: PostRecord): number {
  const aTrashedAt = a.trashedAt ?? "";
  const bTrashedAt = b.trashedAt ?? "";
  if (aTrashedAt === bTrashedAt) {
    return b.id.localeCompare(a.id);
  }

  return bTrashedAt.localeCompare(aTrashedAt);
}

function getScopedPosts(input: ListPostsInput, source: PostRecord[]): PostRecord[] {
  return input.view === "trash"
    ? source
        .filter((post) => typeof post.trashedAt !== "undefined")
        .sort(sortByTrashedAtDesc)
    : source
        .filter((post) => {
          if (typeof post.trashedAt !== "undefined") {
            return false;
          }

          if (post.mode !== input.view) {
            return false;
          }

          if (input.favoriteOnly && !post.favorite) {
            return false;
          }

          return true;
        })
        .sort(sortByCreatedAtDesc);
}

describe("AuthedScreen", () => {
  let mutablePosts: PostRecord[];

  beforeEach(() => {
    jest.clearAllMocks();
    getNavigationMock().__mockNavigation.reset();
    mutablePosts = clonePosts(basePosts);

    getPostActionsMock().listPostsAction.mockImplementation(async (input: ListPostsInput) => {
      const limit = input.limit ?? 10;
      const scoped = getScopedPosts(input, mutablePosts);

      return {
        ok: true,
        data: {
          items: scoped.slice(0, limit),
          hasNext: scoped.length > limit,
          nextCursor: scoped.length > limit ? scoped[limit - 1].id : null,
        },
      };
    });

    getPostActionsMock().setFavoriteAction.mockImplementation(
      async ({ postId, favorite }: { postId: string; favorite: boolean }) => {
        const target = mutablePosts.find((post) => post.id === postId);
        if (!target) {
          return {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "対象が見つかりません",
            },
          };
        }

        target.favorite = favorite;

        return {
          ok: true,
          data: { ...target },
        };
      }
    );

    getPostActionsMock().createPostAction.mockImplementation(
      async ({
        mode,
        title,
        content,
      }: {
        mode: "memo" | "note";
        title?: string;
        content: PostRecord["content"];
      }) => {
        const max = mutablePosts.reduce((currentMax, post) => {
          const match = /^post-(\d+)$/.exec(post.id);
          if (!match) {
            return currentMax;
          }
          const value = Number.parseInt(match[1], 10);
          return Number.isNaN(value) ? currentMax : Math.max(currentMax, value);
        }, 0);

        const created: PostRecord = {
          id: `post-${`${max + 1}`.padStart(3, "0")}`,
          mode,
          title: mode === "note" ? title?.trim() || undefined : undefined,
          content,
          contentText: extractContentText(content, mode),
          favorite: false,
          createdAt: "2026-02-17 10:00",
        };
        mutablePosts = [created, ...mutablePosts];
        return { ok: true, data: created };
      }
    );

    getPostActionsMock().updatePostAction.mockImplementation(
      async ({
        postId,
        title,
        content,
      }: {
        postId: string;
        title?: string;
        content: PostRecord["content"];
      }) => {
        const target = mutablePosts.find((post) => post.id === postId);
        if (!target) {
          return {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "対象が見つかりません",
            },
          };
        }

        target.content = content;
        target.contentText = extractContentText(content, target.mode);
        target.title = target.mode === "note" ? title?.trim() || undefined : undefined;

        return {
          ok: true,
          data: { ...target },
        };
      }
    );

    getPostActionsMock().moveToTrashAction.mockImplementation(async ({ postId }: { postId: string }) => {
      const target = mutablePosts.find((post) => post.id === postId);
      if (!target) {
        return {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "対象が見つかりません",
          },
        };
      }

      target.trashedAt = target.trashedAt ?? "2026-02-17 10:01";
      return { ok: true, data: null };
    });

    getPostActionsMock().restoreFromTrashAction.mockImplementation(
      async ({ postId }: { postId: string }) => {
        const target = mutablePosts.find((post) => post.id === postId);
        if (!target) {
          return {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "対象が見つかりません",
            },
          };
        }

        target.trashedAt = undefined;
        return { ok: true, data: null };
      }
    );
  });

  it("replaces missing view query with view=memo on initial render", async () => {
    render(<AuthedScreen logoutUrl="/" />);

    expect(getNavigationMock().__mockNavigation.getReplaceMock()).toHaveBeenCalledWith(
      "/?view=memo"
    );

    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledWith({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
      });
    });

    expect(screen.getByRole("heading", { level: 2, name: "メモ" })).toBeInTheDocument();
  });

  it("does not replace for already-valid query even when key order is non-canonical", async () => {
    getNavigationMock().__mockNavigation.setQuery("view=note&stubAuth=1&favoriteNote");

    render(<AuthedScreen logoutUrl="/" />);

    expect(getNavigationMock().__mockNavigation.getReplaceMock()).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledWith({
        view: "note",
        favoriteOnly: true,
        limit: 10,
      });
    });

    expect(screen.getByRole("heading", { level: 2, name: "ノート" })).toBeInTheDocument();
  });

  it("pushes next query while preserving unknown keys", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("stubAuth=1&foo=bar&view=memo&favoriteMemo");

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ノート" }));

    expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith(
      "/?stubAuth=1&foo=bar&view=note&favoriteMemo="
    );

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenLastCalledWith(
      "/?stubAuth=1&foo=bar&view=trash&favoriteMemo="
    );
  });

  it("calls listPostsAction when view changes and ignores favorite in trash", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note&favoriteNote");

    render(<AuthedScreen logoutUrl="/" />);

    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledWith({
        view: "note",
        favoriteOnly: true,
        limit: 10,
      });
    });

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledWith({
        view: "trash",
        favoriteOnly: false,
        limit: 10,
      });
    });
  });

  it("calls setFavoriteAction and updates the current list", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");

    const memoCard = screen.getByText("買い物メモ: 牛乳、パン、トマト").closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "お気に入り" }));

    await waitFor(() => {
      expect(getPostActionsMock().setFavoriteAction).toHaveBeenCalledWith({
        postId: "post-001",
        favorite: true,
      });
    });
  });

  it("removes an item immediately when unfavoriting in favorite-only mode", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note&favoriteNote");

    render(<AuthedScreen logoutUrl="/" />);

    const noteBody = await screen.findByText(/今日の学び/);
    const noteCard = noteBody.closest("article");
    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "お気に入り" }));

    await waitFor(() => {
      expect(getPostActionsMock().setFavoriteAction).toHaveBeenCalledWith({
        postId: "post-002",
        favorite: false,
      });
    });

    expect(screen.queryByText(/今日の学び/)).not.toBeInTheDocument();
    expect(screen.getByText("投稿がありません。")).toBeInTheDocument();
  });

  it("does not show previous view data while waiting for the next view response", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    getPostActionsMock().listPostsAction.mockImplementation(async (input: ListPostsInput) => {
      const limit = input.limit ?? 10;
      const scoped = getScopedPosts(input, mutablePosts);

      if (input.view === "note") {
        await new Promise((resolve) => {
          setTimeout(resolve, 60);
        });
      }

      return {
        ok: true,
        data: {
          items: scoped.slice(0, limit),
          hasNext: scoped.length > limit,
          nextCursor: scoped.length > limit ? scoped[limit - 1].id : null,
        },
      };
    });

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.click(screen.getByRole("button", { name: "ノート" }));

    expect(screen.queryByText("買い物メモ: 牛乳、パン、トマト")).not.toBeInTheDocument();
    expect(screen.getByText("読み込み中")).toBeInTheDocument();

    await screen.findByText(/今日の学び/);
  });

  it("shows explicit NOT_IMPLEMENTED error message on screen", async () => {
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().listPostsAction.mockResolvedValue({
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "現在この環境では投稿機能を利用できません。",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    expect(await screen.findByText("現在この環境では投稿機能を利用できません。")).toBeInTheDocument();
    expect(screen.queryByText("投稿がありません。")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("現在この環境では投稿機能を利用できません。");
  });

  it("restores trash item through restoreFromTrashAction", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    const restoreButtons = await screen.findAllByRole("button", { name: "復元" });

    await user.click(restoreButtons[0]);

    expect(getPostActionsMock().restoreFromTrashAction).toHaveBeenCalledWith({
      postId: "trash-001",
    });
    expect(toast).toHaveBeenCalledWith("投稿を復元しました");
  });

  it("keeps trash item visible and shows error when restoreFromTrashAction fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");
    getPostActionsMock().restoreFromTrashAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "対象が見つかりません",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    const restoreButtons = await screen.findAllByRole("button", { name: "復元" });
    await user.click(restoreButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("対象が見つかりません");
    });
    expect(screen.getByText("破棄候補メモ: 先週の打ち合わせメモ")).toBeInTheDocument();
  });

  it("keeps permanent delete as stub action for row button", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    const deleteButtons = await screen.findAllByRole("button", { name: "完全に削除" });
    await user.click(deleteButtons[0]);

    expect(toast).toHaveBeenCalledWith("未実装です");
  });

  it("creates a memo post and updates the list immediately", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.type(screen.getByLabelText("メモ本文"), "新規メモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(getPostActionsMock().createPostAction).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("新規メモ")).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("保存しました");
  });

  it("keeps memo draft and shows error when createPostAction fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().createPostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "内容は最大280文字までです",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    const input = screen.getByLabelText("メモ本文");
    await user.type(input, "失敗するメモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("内容は最大280文字までです");
    });
    expect(input).toHaveValue("失敗するメモ");
  });

  it("updates memo inline edit and reflects the new content", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "更新後のメモ");
    await user.click(within(memoCard).getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-001",
        })
      );
    });
    expect(screen.getByText("更新後のメモ")).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("更新しました");
  });

  it("keeps memo inline edit open and shows error when updatePostAction fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().updatePostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "内容は最大280文字までです",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "失敗する更新");
    await user.click(within(memoCard).getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-001",
        })
      );
    });
    expect(toast.error).toHaveBeenCalledWith("内容は最大280文字までです");
    expect(within(memoCard).getByRole("button", { name: "更新する" })).toBeInTheDocument();
    expect(input).toHaveValue("失敗する更新");
  });

  it("keeps note edit modal open and shows error when updatePostAction fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");
    getPostActionsMock().updatePostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に不備があります",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    const noteCard = (await screen.findByText(/今日の学び/)).closest("article");
    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-002",
        })
      );
    });
    expect(toast.error).toHaveBeenCalledWith("入力内容に不備があります");
    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });

  it("moves a post to trash and removes it from the active list immediately", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "削除" }));

    await waitFor(() => {
      expect(getPostActionsMock().moveToTrashAction).toHaveBeenCalledWith({
        postId: "post-001",
      });
    });
    expect(screen.queryByText("買い物メモ: 牛乳、パン、トマト")).not.toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("投稿を削除しました");
  });

  it("keeps list item visible and shows error when moveToTrashAction fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().moveToTrashAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "対象が見つかりません",
      },
    });

    render(<AuthedScreen logoutUrl="/" />);

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "削除" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("対象が見つかりません");
    });
    expect(screen.getByText("買い物メモ: 牛乳、パン、トマト")).toBeInTheDocument();
  });

  it("shows bulk actions and updates selected count from row checkbox", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByRole("checkbox", { name: "trash-001を選択" });
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));

    expect(screen.getByText("1件選択中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeEnabled();
  });

  it("toggles all visible trash post selections", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("checkbox", { name: "表示中の投稿を選択" }));

    expect(screen.getByText("3件選択中")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "選択を解除" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "選択を解除" }));

    expect(screen.queryByText("3件選択中")).not.toBeInTheDocument();
    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
  });

  it("opens selected-delete confirmation dialog and shows stub toast on confirm", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    await user.click(screen.getByRole("button", { name: "選択した投稿を削除" }));

    expect(screen.getByText("1件の投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(toast).toHaveBeenCalledWith("未実装です");
  });

  it("opens empty-trash confirmation dialog and shows stub toast on confirm", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("button", { name: "ごみ箱を空にする" }));

    expect(screen.getByText("ごみ箱内のすべての投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(toast).toHaveBeenCalledWith("未実装です");
  });

  it("resets trash selections when leaving and returning to trash view", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    expect(screen.getByText("1件選択中")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "メモ" }));
    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    await screen.findByRole("checkbox", { name: "trash-001を選択" });
    expect(screen.queryByText("1件選択中")).not.toBeInTheDocument();
  });

  it("opens inline memo edit and returns to normal view on cancel", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    const memoText = await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    const memoCard = memoText.closest("article");

    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));

    expect(within(memoCard).getByRole("button", { name: "更新する" })).toBeInTheDocument();

    await user.click(within(memoCard).getByRole("button", { name: "キャンセル" }));

    expect(within(memoCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();
  });

  it("opens note edit modal and updates note", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByRole("button", { name: "ノートを書く" })).toBeInTheDocument();

    const noteCard = (await screen.findByText(/今日の学び/)).closest("article");

    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));

    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-002",
        })
      );
    });
    expect(toast).toHaveBeenCalledWith("更新しました");
  });
});
