import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import AuthedScreen from "@/components/authed/AuthedScreen";
import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import { comparePostsByCreatedAtDesc, comparePostsByTrashedAtDesc } from "@/lib/posts/sort";
import type { ListPostsInput, PostRecord } from "@/lib/posts/types";
import { toast } from "sonner";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

jest.mock("@/components/ui/dialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const DialogContext = React.createContext<{
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
  } | null>(null);

  const useDialogContext = () => {
    const context = React.useContext(DialogContext);
    if (!context) {
      return {
        open: true,
        setOpen: () => {},
      };
    }
    return context;
  };

  const Dialog = ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = typeof open === "boolean";
    const currentOpen = isControlled ? open : internalOpen;
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    React.useEffect(() => {
      if (!currentOpen) {
        return;
      }

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (!isControlled) {
            setInternalOpen(false);
          }
          onOpenChange?.(false);
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    }, [currentOpen, isControlled, onOpenChange]);

    return <DialogContext.Provider value={{ open: currentOpen, setOpen }}>{children}</DialogContext.Provider>;
  };

  const DialogTrigger = ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: React.ReactNode;
  }) => {
    const { setOpen } = useDialogContext();
    if (asChild && React.isValidElement<{ onClick?: () => void }>(children)) {
      return React.cloneElement(children, {
        onClick: () => {
          children.props.onClick?.();
          setOpen(true);
        },
      });
    }

    return (
      <button type="button" onClick={() => setOpen(true)}>
        {children}
      </button>
    );
  };

  const DialogContent = ({
    children,
    onKeyDown,
    onEscapeKeyDown,
    showCloseButton,
    ...restProps
  }: {
    children: React.ReactNode;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    onEscapeKeyDown?: (event: { preventDefault: () => void }) => void;
    showCloseButton?: boolean;
  } & React.HTMLAttributes<HTMLDivElement>) => {
    const { open, setOpen } = useDialogContext();
    if (!open) {
      return null;
    }
    void showCloseButton;
    return (
      <div
        role="dialog"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key !== "Escape") {
            return;
          }

          let prevented = false;
          onEscapeKeyDown?.({
            preventDefault: () => {
              prevented = true;
            },
          });
          if (!prevented) {
            setOpen(false);
          }
        }}
        {...restProps}
      >
        {children}
      </div>
    );
  };

  const DialogHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>;
  const DialogDescription = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;
  const DialogFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const DialogOverlay = () => null;
  const DialogClose = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogPortal,
    DialogOverlay,
    DialogClose,
  };
});

jest.mock("@/components/ui/alert-dialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const AlertDialogContext = React.createContext<{
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
  } | null>(null);

  const useAlertDialogContext = () => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      return {
        open: true,
        setOpen: () => {},
      };
    }
    return context;
  };

  const AlertDialog = ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = typeof open === "boolean";
    const currentOpen = isControlled ? open : internalOpen;
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };
    return (
      <AlertDialogContext.Provider value={{ open: currentOpen, setOpen }}>
        {children}
      </AlertDialogContext.Provider>
    );
  };

  const AlertDialogContent = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = useAlertDialogContext();
    if (!open) {
      return null;
    }
    return (
      <div role="alertdialog" {...props}>
        {children}
      </div>
    );
  };

  const AlertDialogAction = ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    return (
      <button
        type="button"
        onClick={(event) => {
          onClick?.(event);
        }}
        {...props}
      >
        {children}
      </button>
    );
  };

  const AlertDialogCancel = ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { setOpen } = useAlertDialogContext();
    return (
      <button
        type="button"
        onClick={(event) => {
          onClick?.(event);
          setOpen(false);
        }}
        {...props}
      >
        {children}
      </button>
    );
  };

  const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>;
  const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => <p>{children}</p>;
  const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const AlertDialogOverlay = () => null;
  const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  };
});

jest.mock("@/components/ui/popover", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const PopoverContext = React.createContext<{
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
  } | null>(null);

  const usePopoverContext = () => {
    const context = React.useContext(PopoverContext);
    if (!context) {
      return {
        open: false,
        setOpen: () => {},
      };
    }
    return context;
  };

  const Popover = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return <PopoverContext.Provider value={{ open, setOpen }}>{children}</PopoverContext.Provider>;
  };

  const PopoverTrigger = ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: React.ReactNode;
  }) => {
    const { setOpen } = usePopoverContext();
    if (asChild && React.isValidElement<{ onClick?: () => void }>(children)) {
      return React.cloneElement(children, {
        onClick: () => {
          children.props.onClick?.();
          setOpen(true);
        },
      });
    }

    return (
      <button type="button" onClick={() => setOpen(true)}>
        {children}
      </button>
    );
  };

  const PopoverContent = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = usePopoverContext();
    if (!open) {
      return null;
    }
    return (
      <div {...props}>
        {children}
      </div>
    );
  };

  return {
    Popover,
    PopoverTrigger,
    PopoverContent,
  };
});

jest.mock("@/app/actions/postActions", () => ({
  createPostAction: jest.fn(),
  deleteTrashPostsAction: jest.fn(),
  emptyTrashAction: jest.fn(),
  listPostsAction: jest.fn(),
  moveToTrashAction: jest.fn(),
  restoreFromTrashAction: jest.fn(),
  setFavoriteAction: jest.fn(),
  updatePostAction: jest.fn(),
}));

jest.mock("@/lib/auth/client", () => ({
  signInGoogle: jest.fn(),
  signOutToRoot: jest.fn(async () => "/"),
}));

jest.mock("@/lib/auth/logoutCleanup", () => ({
  cleanupAfterLogout: jest.fn(),
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
  deleteTrashPostsAction: jest.Mock;
  emptyTrashAction: jest.Mock;
  listPostsAction: jest.Mock;
  moveToTrashAction: jest.Mock;
  restoreFromTrashAction: jest.Mock;
  setFavoriteAction: jest.Mock;
  updatePostAction: jest.Mock;
};

function getPostActionsMock() {
  return jest.requireMock("@/app/actions/postActions") as PostActionsModule;
}

type AuthClientModule = {
  signInGoogle: jest.Mock;
  signOutToRoot: jest.Mock;
};

function getAuthClientMock() {
  return jest.requireMock("@/lib/auth/client") as AuthClientModule;
}

type LogoutCleanupModule = {
  cleanupAfterLogout: jest.Mock;
};

function getLogoutCleanupMock() {
  return jest.requireMock("@/lib/auth/logoutCleanup") as LogoutCleanupModule;
}

function renderAuthedScreen(props?: Partial<ComponentProps<typeof AuthedScreen>>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <AuthedScreen authMode="stub" {...props} />
    </QueryClientProvider>
  );

  return { ...rendered, queryClient };
}

async function findTodayLearningNoteCard() {
  const noteContent = (await screen.findAllByTestId("post-content")).find((element) =>
    element.textContent?.includes("今日の学び")
  );
  return noteContent?.closest("article") ?? null;
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

function getScopedPosts(input: ListPostsInput, source: PostRecord[]): PostRecord[] {
  return input.view === "trash"
    ? source
        .filter((post) => typeof post.trashedAt !== "undefined")
        .sort(comparePostsByTrashedAtDesc)
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
        .sort(comparePostsByCreatedAtDesc);
}

function resolveCursorStartIndex(items: PostRecord[], cursor: string | undefined): number {
  if (typeof cursor === "undefined") {
    return 0;
  }

  const index = items.findIndex((post) => post.id === cursor);
  if (index === -1) {
    return items.length;
  }

  return index + 1;
}

function getRenderedPostIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('article[data-testid^="post-card-"]'))
    .map((node) => node.dataset.testid?.replace(/^post-card-/, ""))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
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
      const startIndex = resolveCursorStartIndex(scoped, input.cursor);
      const items = scoped.slice(startIndex, startIndex + limit);
      const hasNext = startIndex + limit < scoped.length;

      return {
        ok: true,
        data: {
          items,
          hasNext,
          nextCursor: hasNext && items.length > 0 ? items[items.length - 1].id : null,
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

    getPostActionsMock().deleteTrashPostsAction.mockImplementation(
      async ({ postIds }: { postIds: string[] }) => {
        const ids = Array.from(new Set(postIds));
        const targets = ids
          .map((postId) => mutablePosts.find((post) => post.id === postId))
          .filter((post): post is PostRecord => Boolean(post));

        if (targets.length !== ids.length || targets.some((post) => typeof post.trashedAt === "undefined")) {
          return {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "対象が見つかりません",
            },
          };
        }

        const deleteSet = new Set(ids);
        mutablePosts = mutablePosts.filter((post) => !deleteSet.has(post.id));
        return {
          ok: true,
          data: {
            deletedPostIds: ids,
          },
        };
      }
    );

    getPostActionsMock().emptyTrashAction.mockImplementation(async () => {
      const beforeCount = mutablePosts.length;
      mutablePosts = mutablePosts.filter((post) => typeof post.trashedAt === "undefined");
      return {
        ok: true,
        data: {
          deletedCount: beforeCount - mutablePosts.length,
        },
      };
    });
  });

  it("replaces missing view query with view=memo on initial render", async () => {
    renderAuthedScreen();

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

  it("logs out with authjs, runs cleanup, and navigates to returned url", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen({ authMode: "authjs" });

    await user.click(screen.getByRole("button", { name: "ユーザーメニュー" }));
    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(getAuthClientMock().signOutToRoot).toHaveBeenCalledTimes(1);
    });
    expect(getLogoutCleanupMock().cleanupAfterLogout).toHaveBeenCalledTimes(1);
    expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith("/");
  });

  it("shows error and skips cleanup when authjs logout fails", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getAuthClientMock().signOutToRoot.mockRejectedValueOnce(new Error("logout failed"));

    renderAuthedScreen({ authMode: "authjs" });

    await user.click(screen.getByRole("button", { name: "ユーザーメニュー" }));
    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("logout failed");
    });
    expect(getLogoutCleanupMock().cleanupAfterLogout).not.toHaveBeenCalled();
  });

  it("logs out in stub mode without signOut and navigates to root", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo&stubAuth=1");

    renderAuthedScreen({ authMode: "stub" });

    await user.click(screen.getByRole("button", { name: "ユーザーメニュー" }));
    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(getLogoutCleanupMock().cleanupAfterLogout).toHaveBeenCalledTimes(1);
    });
    expect(getAuthClientMock().signOutToRoot).not.toHaveBeenCalled();
    expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith("/");
  });

  it("does not replace for already-valid query even when key order is non-canonical", async () => {
    getNavigationMock().__mockNavigation.setQuery("view=note&stubAuth=1&favoriteNote");

    renderAuthedScreen();

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

    renderAuthedScreen();

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

    renderAuthedScreen();

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

  it("restores memo scroll position when returning from note via browser back", async () => {
    const user = userEvent.setup();
    await act(async () => {
      getNavigationMock().__mockNavigation.setQuery("view=memo");
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 480,
    });

    renderAuthedScreen();

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.click(screen.getByRole("button", { name: "ノート" }));

    await waitFor(() => {
      expect(sessionStorage.getItem("mono-log:scroll:v1:memo:0")).toBe("480");
    });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });

    await act(async () => {
      getNavigationMock().__mockNavigation.setQuery("view=memo");
    });

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 480, left: 0, behavior: "auto" });
    });
  });

  it("does not overwrite saved memo scroll position with 0 during popstate navigation", async () => {
    const user = userEvent.setup();
    await act(async () => {
      getNavigationMock().__mockNavigation.setQuery("view=memo");
    });

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 640,
    });

    renderAuthedScreen();
    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.click(screen.getByRole("button", { name: "ノート" }));

    await waitFor(() => {
      expect(sessionStorage.getItem("mono-log:scroll:v1:memo:0")).toBe("640");
    });

    window.dispatchEvent(new PopStateEvent("popstate"));

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });

    await act(async () => {
      getNavigationMock().__mockNavigation.setQuery("view=memo");
    });

    await waitFor(() => {
      expect(sessionStorage.getItem("mono-log:scroll:v1:memo:0")).toBe("640");
    });
  });

  it("does not auto-retry next-page fetch after next-page error until user retries", async () => {
    const user = userEvent.setup();
    const originalIntersectionObserver = global.IntersectionObserver;
    const observerInstances: Array<{
      callback: IntersectionObserverCallback;
      isActive: boolean;
    }> = [];

    class TestIntersectionObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin = "";
      readonly thresholds: ReadonlyArray<number> = [];
      private readonly index: number;

      constructor(callback: IntersectionObserverCallback) {
        observerInstances.push({
          callback,
          isActive: false,
        });
        this.index = observerInstances.length - 1;
      }

      observe() {
        observerInstances[this.index].isActive = true;
      }

      unobserve() {
        observerInstances[this.index].isActive = false;
      }

      disconnect() {
        observerInstances[this.index].isActive = false;
      }

      takeRecords() {
        return [];
      }
    }

    global.IntersectionObserver =
      TestIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      getNavigationMock().__mockNavigation.setQuery("view=memo");
      mutablePosts = Array.from({ length: 12 }, (_, index) => ({
        id: `post-${`${index + 100}`.padStart(3, "0")}`,
        mode: "memo",
        content: createDocFromPlainText(`memo-${index}`),
        contentText: `memo-${index}`,
        favorite: false,
        createdAt: `2026-02-${`${18 - Math.floor(index / 6)}`.padStart(2, "0")} ${`${23 - (index % 6)}`.padStart(2, "0")}:00`,
      }));

      getPostActionsMock().listPostsAction.mockImplementation(async (input: ListPostsInput) => {
        const limit = input.limit ?? 10;
        const scoped = getScopedPosts(input, mutablePosts);
        const startIndex = resolveCursorStartIndex(scoped, input.cursor);
        const items = scoped.slice(startIndex, startIndex + limit);
        const hasNext = startIndex + limit < scoped.length;

        if (typeof input.cursor !== "undefined") {
          return {
            ok: false,
            error: {
              code: "INVALID_CURSOR",
              message: "cursor is invalid",
            },
          };
        }

        return {
          ok: true,
          data: {
            items,
            hasNext,
            nextCursor: hasNext && items.length > 0 ? items[items.length - 1].id : null,
          },
        };
      });

      renderAuthedScreen();

      await screen.findByText("memo-0");
      await screen.findByTestId("posts-load-more-sentinel");
      await waitFor(() => {
        expect(observerInstances.some((instance) => instance.isActive)).toBe(true);
      });

      const triggerIntersection = () => {
        const activeCallbacks = observerInstances
          .filter((instance) => instance.isActive)
          .map((instance) => instance.callback);
        for (const callback of activeCallbacks) {
          callback(
            [
              {
                isIntersecting: true,
              } as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver
          );
        }
      };

      triggerIntersection();
      await waitFor(() => {
        expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
      });
      expect(screen.getByRole("button", { name: "追加取得を再試行" })).toBeInTheDocument();

      triggerIntersection();
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);

      await user.click(screen.getByRole("button", { name: "追加取得を再試行" }));
      await waitFor(() => {
        expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(3);
      });
    } finally {
      global.IntersectionObserver = originalIntersectionObserver;
    }
  });

  it("calls setFavoriteAction and updates the current list", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

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

  it("does not refetch when toggling favorite filter between already-cached conditions", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
      expect(getPostActionsMock().listPostsAction).toHaveBeenLastCalledWith({
        view: "memo",
        favoriteOnly: true,
        limit: 10,
      });
    });

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: true }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "お気に入り", pressed: false })).toBeInTheDocument();
    });
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
    });
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
  });

  it("keeps favorite caches in sync when moving from favorite-off to favorite-on list", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
    });
    expect(screen.getByText("投稿がありません。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: true }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "お気に入り", pressed: false })).toBeInTheDocument();
    });
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);

    const nonFavoriteMemoCard = screen.getByText("買い物メモ: 牛乳、パン、トマト").closest("article");
    if (!nonFavoriteMemoCard) {
      throw new Error("non-favorite memo card not found");
    }

    await user.click(within(nonFavoriteMemoCard).getByRole("button", { name: "お気に入り" }));
    await waitFor(() => {
      expect(getPostActionsMock().setFavoriteAction).toHaveBeenCalledWith({
        postId: "post-001",
        favorite: true,
      });
    });

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
    });
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
    const syncedCard = screen.getByText("買い物メモ: 牛乳、パン、トマト").closest("article");
    if (!syncedCard) {
      throw new Error("synced memo card not found");
    }
    const syncedFavoriteButton = within(syncedCard).getByRole("button", { name: "お気に入り" });
    const syncedFavoriteIcon = syncedFavoriteButton.querySelector("svg");
    if (!syncedFavoriteIcon) {
      throw new Error("favorite icon not found");
    }
    expect(syncedFavoriteIcon.className.baseVal).toContain("fill-amber-400");
  });

  it("keeps favorite caches in sync when moving from favorite-on to favorite-off list", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await screen.findByText(/今日の学び/);
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
    });

    const noteCard = screen.getByText(/今日の学び/).closest("article");
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
    expect(screen.getByText("投稿がありません。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: true }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "お気に入り", pressed: false })).toBeInTheDocument();
    });
    const syncedCard = screen.getByText(/今日の学び/).closest("article");
    if (!syncedCard) {
      throw new Error("synced note card not found");
    }
    const syncedFavoriteButton = within(syncedCard).getByRole("button", { name: "お気に入り" });
    const syncedFavoriteIcon = syncedFavoriteButton.querySelector("svg");
    if (!syncedFavoriteIcon) {
      throw new Error("favorite icon not found");
    }
    expect(syncedFavoriteIcon.className.baseVal).not.toContain("fill-amber-400");
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
  });

  it("falls back to invalidation when related caches are not found", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    const { queryClient } = renderAuthedScreen();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(1);
    });

    getPostActionsMock().setFavoriteAction.mockImplementationOnce(
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
          data: {
            ...target,
            mode: "note",
          },
        };
      }
    );

    const memoCard = screen.getByText("買い物メモ: 牛乳、パン、トマト").closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "お気に入り" }));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["posts", { view: "memo", favoriteOnly: false }],
        exact: true,
      });
    });
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
    });
  });

  it("removes an item immediately when unfavoriting in favorite-only mode", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note&favoriteNote");

    renderAuthedScreen();

    await screen.findByText(/今日の学び/);
    const noteContent = screen
      .getAllByTestId("post-content")
      .find((element) => element.textContent?.includes("今日の学び"));
    const noteCard = noteContent?.closest("article");
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

  it("updates favorite button visual state and aria-pressed", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();
    await screen.findByText("買い物メモ: 牛乳、パン、トマト");

    const favoriteButtonOff = screen.getByRole("button", { name: "お気に入り", pressed: false });
    expect(favoriteButtonOff.className).not.toContain("border-amber-400");
    const offIcon = favoriteButtonOff.querySelector("svg");
    if (!offIcon) {
      throw new Error("favorite icon not found");
    }
    expect(offIcon.className.baseVal).not.toContain("fill-amber-400");

    await user.click(favoriteButtonOff);
    const favoriteButtonOn = await screen.findByRole("button", { name: "お気に入り", pressed: true });
    expect(favoriteButtonOn.className).toContain("border-amber-400");
    const onIcon = favoriteButtonOn.querySelector("svg");
    if (!onIcon) {
      throw new Error("favorite icon not found");
    }
    expect(onIcon.className.baseVal).toContain("fill-amber-400");
  });

  it("does not render favorite filter button in trash view", async () => {
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();
    await screen.findByText("破棄候補メモ: 先週の打ち合わせメモ");

    expect(screen.queryByRole("button", { name: "お気に入り" })).not.toBeInTheDocument();
  });

  it("does not show previous view data while waiting for the next view response", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    getPostActionsMock().listPostsAction.mockImplementation(async (input: ListPostsInput) => {
      const limit = input.limit ?? 10;
      const scoped = getScopedPosts(input, mutablePosts);
      const startIndex = resolveCursorStartIndex(scoped, input.cursor);
      const items = scoped.slice(startIndex, startIndex + limit);
      const hasNext = startIndex + limit < scoped.length;

      if (input.view === "note") {
        await new Promise((resolve) => {
          setTimeout(resolve, 60);
        });
      }

      return {
        ok: true,
        data: {
          items,
          hasNext,
          nextCursor: hasNext && items.length > 0 ? items[items.length - 1].id : null,
        },
      };
    });

    renderAuthedScreen();

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

    renderAuthedScreen();

    expect(await screen.findByText("現在この環境では投稿機能を利用できません。")).toBeInTheDocument();
    expect(screen.queryByText("投稿がありません。")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("現在この環境では投稿機能を利用できません。");
  });

  it("retries initial load when retry button is clicked", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().listPostsAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "初回取得に失敗しました",
      },
    });

    renderAuthedScreen();

    expect(await screen.findByText("初回取得に失敗しました")).toBeInTheDocument();
    expect(screen.queryByText("買い物メモ: 牛乳、パン、トマト")).not.toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "再試行" });

    await user.click(retryButton);

    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("買い物メモ: 牛乳、パン、トマト")).toBeInTheDocument();
    expect(screen.queryByText("初回取得に失敗しました")).not.toBeInTheDocument();
  });

  it("restores trash item through restoreFromTrashAction", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

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

    renderAuthedScreen();

    const restoreButtons = await screen.findAllByRole("button", { name: "復元" });
    await user.click(restoreButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("対象が見つかりません");
    });
    expect(screen.getByText("破棄候補メモ: 先週の打ち合わせメモ")).toBeInTheDocument();
  });

  it("deletes trash row immediately on permanent delete", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

    await screen.findByText("破棄候補メモ: 先週の打ち合わせメモ");
    const deleteButtons = await screen.findAllByRole("button", { name: "完全に削除" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(getPostActionsMock().deleteTrashPostsAction).toHaveBeenCalledWith({
        postIds: ["trash-001"],
      });
    });
    expect(toast).toHaveBeenCalledWith("投稿を完全に削除しました");
    expect(screen.queryByText("破棄候補メモ: 先週の打ち合わせメモ")).not.toBeInTheDocument();
  });

  it("retries row permanent delete after failure", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");
    getPostActionsMock().deleteTrashPostsAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "削除に失敗しました",
      },
    });

    renderAuthedScreen();

    await screen.findByText("破棄候補メモ: 先週の打ち合わせメモ");
    const deleteButtons = await screen.findAllByRole("button", { name: "完全に削除" });

    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
    expect(screen.getByText("破棄候補メモ: 先週の打ち合わせメモ")).toBeInTheDocument();

    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(getPostActionsMock().deleteTrashPostsAction).toHaveBeenCalledTimes(2);
    });
    expect(toast).toHaveBeenCalledWith("投稿を完全に削除しました");
    expect(screen.queryByText("破棄候補メモ: 先週の打ち合わせメモ")).not.toBeInTheDocument();
  });

  it("creates a memo post and updates the list immediately", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.type(screen.getByLabelText("メモ本文"), "新規メモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(getPostActionsMock().createPostAction).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("新規メモ")).toBeInTheDocument();
    expect(screen.getByText("打ち合わせは金曜 14:00 から")).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith("保存しました");
  });

  it("keeps memo order consistent between immediate insert and refetch", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().createPostAction.mockImplementationOnce(
      async ({
        mode,
        title,
        content,
      }: {
        mode: "memo" | "note";
        title?: string;
        content: PostRecord["content"];
      }) => {
        const created: PostRecord = {
          id: "post-000",
          mode,
          title: mode === "note" ? title?.trim() || undefined : undefined,
          content,
          contentText: extractContentText(content, mode),
          favorite: false,
          createdAt: "2026-02-08 09:12",
          createdAtEpochMs: Date.UTC(2026, 1, 8, 0, 12, 30),
        };
        mutablePosts = [created, ...mutablePosts];
        return { ok: true, data: created };
      }
    );

    const { container } = renderAuthedScreen();

    await screen.findByText("買い物メモ: 牛乳、パン、トマト");
    await user.type(screen.getByLabelText("メモ本文"), "同分ソート検証メモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(getPostActionsMock().createPostAction).toHaveBeenCalledTimes(1);
    });
    await screen.findByText("同分ソート検証メモ");

    const immediateOrder = getRenderedPostIds(container);
    expect(immediateOrder[0]).toBe("post-000");

    await user.click(screen.getByRole("button", { name: "ノート" }));
    await user.click(screen.getByRole("button", { name: "メモ" }));

    await screen.findByText("同分ソート検証メモ");
    const refetchedOrder = getRenderedPostIds(container);

    expect(refetchedOrder).toEqual(immediateOrder);
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

    renderAuthedScreen();

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

    renderAuthedScreen();

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

    renderAuthedScreen();

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

  it.each([
    { code: "FORBIDDEN", message: "操作権限がありません" },
    { code: "NOT_FOUND", message: "対象が見つかりません" },
    { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" },
  ])("keeps memo edit state on $code error", async ({ code, message }) => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().updatePostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code,
        message,
      },
    });

    renderAuthedScreen();

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, `${code}時に保持される入力`);

    const pushMock = getNavigationMock().__mockNavigation.getPushMock();
    const replaceMock = getNavigationMock().__mockNavigation.getReplaceMock();
    const pushCountBefore = pushMock.mock.calls.length;
    const replaceCountBefore = replaceMock.mock.calls.length;

    await user.click(within(memoCard).getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(message);
    });
    expect(within(memoCard).getByRole("button", { name: "更新する" })).toBeInTheDocument();
    expect(input).toHaveValue(`${code}時に保持される入力`);
    expect(pushMock).toHaveBeenCalledTimes(pushCountBefore);
    expect(replaceMock).toHaveBeenCalledTimes(replaceCountBefore);
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

    renderAuthedScreen();

    const noteCard = await findTodayLearningNoteCard();
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

    renderAuthedScreen();

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

  it("updates cached trash list on moveToTrash without refetching lists", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

    await screen.findByText("破棄候補メモ: 先週の打ち合わせメモ");
    await user.click(screen.getByRole("button", { name: "メモ" }));
    await screen.findByText("買い物メモ: 牛乳、パン、トマト");

    const listCallCountBeforeDelete = getPostActionsMock().listPostsAction.mock.calls.length;
    const memoCard = screen.getByText("買い物メモ: 牛乳、パン、トマト").closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "削除" }));
    await waitFor(() => {
      expect(getPostActionsMock().moveToTrashAction).toHaveBeenCalledWith({
        postId: "post-001",
      });
    });
    expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(listCallCountBeforeDelete);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await waitFor(() => {
      expect(getPostActionsMock().listPostsAction).toHaveBeenCalledTimes(listCallCountBeforeDelete);
    });
    expect(screen.getByText("買い物メモ: 牛乳、パン、トマト")).toBeInTheDocument();
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

    renderAuthedScreen();

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

    renderAuthedScreen();

    await screen.findByRole("checkbox", { name: "trash-001を選択" });
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));

    expect(screen.getByText("1件選択中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeEnabled();
  });

  it("toggles all visible trash post selections", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("checkbox", { name: "表示中の投稿を選択" }));

    expect(screen.getByText("3件選択中")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "選択を解除" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "選択を解除" }));

    expect(screen.queryByText("3件選択中")).not.toBeInTheDocument();
    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
  });

  it("opens selected-delete confirmation dialog and deletes selected posts on confirm", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    await user.click(screen.getByRole("button", { name: "選択した投稿を削除" }));

    expect(screen.getByText("1件の投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(getPostActionsMock().deleteTrashPostsAction).toHaveBeenCalledWith({
        postIds: ["trash-001"],
      });
    });
    expect(toast).toHaveBeenCalledWith("投稿を完全に削除しました");
    expect(screen.queryByText("破棄候補メモ: 先週の打ち合わせメモ")).not.toBeInTheDocument();
  });

  it("keeps selected-delete dialog open on failure and allows retry", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");
    getPostActionsMock().deleteTrashPostsAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "削除に失敗しました",
      },
    });

    renderAuthedScreen();

    await screen.findByRole("checkbox", { name: "trash-001を選択" });
    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    await user.click(screen.getByRole("button", { name: "選択した投稿を削除" }));
    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("削除に失敗しました");
    });
    expect(screen.getByText("1件の投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("削除に失敗しました")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));
    await waitFor(() => {
      expect(getPostActionsMock().deleteTrashPostsAction).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText("1件の投稿を完全に削除しますか?")).not.toBeInTheDocument();
    expect(screen.queryByText("破棄候補メモ: 先週の打ち合わせメモ")).not.toBeInTheDocument();
  });

  it("opens empty-trash confirmation dialog and clears trash on confirm", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

    await screen.findByRole("checkbox", { name: "trash-001を選択" });

    await user.click(screen.getByRole("button", { name: "ごみ箱を空にする" }));

    expect(screen.getByText("ごみ箱内のすべての投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(getPostActionsMock().emptyTrashAction).toHaveBeenCalledTimes(1);
    });
    expect(toast).toHaveBeenCalledWith("投稿を完全に削除しました");
    expect(screen.queryByRole("checkbox", { name: "trash-001を選択" })).not.toBeInTheDocument();
  });

  it("resets trash selections when leaving and returning to trash view", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    renderAuthedScreen();

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

    renderAuthedScreen();

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

  it("shows discard confirmation on memo cancel when memo edit is dirty", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "キャンセル確認");
    await user.click(within(memoCard).getByRole("button", { name: "キャンセル" }));

    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(within(memoCard).getByLabelText("メモ本文")).toHaveValue("キャンセル確認");

    await user.click(within(memoCard).getByRole("button", { name: "キャンセル" }));
    await user.click(screen.getByRole("button", { name: "破棄して続行" }));
    expect(within(memoCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();
  });

  it("does not show discard confirmation after memo edit is saved and reopened", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const originalCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!originalCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(originalCard).getByRole("button", { name: "編集" }));
    const input = within(originalCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "保存後のメモ");
    await user.click(within(originalCard).getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(screen.getByText("保存後のメモ")).toBeInTheDocument();
    });

    const savedCard = screen.getByText("保存後のメモ").closest("article");
    if (!savedCard) {
      throw new Error("saved memo card not found");
    }

    await user.click(within(savedCard).getByRole("button", { name: "編集" }));
    await user.click(within(savedCard).getByRole("button", { name: "キャンセル" }));

    expect(within(savedCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
  });

  it("opens note edit modal and updates note", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    expect(screen.getByRole("button", { name: "ノートを書く" })).toBeInTheDocument();

    const noteCard = await findTodayLearningNoteCard();

    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));

    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
    const titleInput = screen.getByLabelText("ノートタイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "保存時ダイアログ確認");

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: "post-002",
        })
      );
    });
    expect(toast).toHaveBeenCalledWith("更新しました");
    await waitFor(() => {
      expect(screen.queryByLabelText("ノートタイトル")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenLastCalledWith("/?view=note");
  });

  it("shows discard confirmation on query change while memo edit is dirty", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "変更したメモ");

    await user.click(screen.getByRole("button", { name: "ノート" }));
    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();
    expect(getNavigationMock().__mockNavigation.getPushMock()).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(input).toHaveValue("変更したメモ");

    await user.click(screen.getByRole("button", { name: "ノート" }));
    await user.click(screen.getByRole("button", { name: "破棄して続行" }));

    await waitFor(() => {
      expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith("/?view=note");
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "ノート" })).toBeInTheDocument();
    });
  });

  it("defers switching to another post edit until discard is confirmed", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const firstMemoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    const secondMemoCard = screen.getByText("打ち合わせは金曜 14:00 から").closest("article");
    if (!firstMemoCard || !secondMemoCard) {
      throw new Error("memo cards not found");
    }

    await user.click(within(firstMemoCard).getByRole("button", { name: "編集" }));
    const firstInput = within(firstMemoCard).getByLabelText("メモ本文");
    await user.clear(firstInput);
    await user.type(firstInput, "1件目を編集中");

    await user.click(within(secondMemoCard).getByRole("button", { name: "編集" }));
    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();
    expect(within(secondMemoCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "破棄して続行" }));

    await waitFor(() => {
      expect(within(firstMemoCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();
      expect(within(secondMemoCard).getByRole("button", { name: "更新する" })).toBeInTheDocument();
    });
  });

  it("routes note close request through discard confirmation", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await user.click(screen.getByRole("button", { name: "ノートを書く" }));
    await user.type(screen.getByLabelText("ノートタイトル"), "編集中ノート");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(screen.getByLabelText("ノートタイトル")).toHaveValue("編集中ノート");

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await user.click(screen.getByRole("button", { name: "破棄して続行" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("ノートタイトル")).not.toBeInTheDocument();
    });
  });

  it("shows discard confirmation when favorite toggle is clicked while dirty", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "お気に入り切替前の編集");

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();
    expect(getNavigationMock().__mockNavigation.getPushMock()).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(input).toHaveValue("お気に入り切替前の編集");
  });

  it("applies favorite toggle after selecting discard and continue", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    renderAuthedScreen();

    const memoCard = (await screen.findByText("買い物メモ: 牛乳、パン、トマト")).closest("article");
    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));
    const input = within(memoCard).getByLabelText("メモ本文");
    await user.clear(input);
    await user.type(input, "破棄してfavorite切替");

    await user.click(screen.getByRole("button", { name: "お気に入り", pressed: false }));
    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "破棄して続行" }));

    await waitFor(() => {
      expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith(
        "/?view=memo&favoriteMemo="
      );
    });
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
    expect(screen.getByLabelText("メモ本文")).toHaveValue("");
    expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
  });

  it("closes note modal immediately on cancel when note is clean", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await user.click(screen.getByRole("button", { name: "ノートを書く" }));
    expect(screen.getByLabelText("ノートタイトル")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("ノートタイトル")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
  });

  it("shows discard confirmation on Escape when note is dirty", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await user.click(screen.getByRole("button", { name: "ノートを書く" }));
    await user.type(screen.getByLabelText("ノートタイトル"), "Esc確認");

    await user.keyboard("{Escape}");

    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();
  });

  it("closes note modal on Escape when note is clean", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await user.click(screen.getByRole("button", { name: "ノートを書く" }));
    expect(screen.getByLabelText("ノートタイトル")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByLabelText("ノートタイトル")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("編集中の内容があります。破棄して続行しますか？")).not.toBeInTheDocument();
  });

  it("pushes noteComposer query on open and removes it on clean close", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    await user.click(screen.getByRole("button", { name: "ノートを書く" }));

    await waitFor(() => {
      expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith(
        "/?view=note&noteComposer=create"
      );
    });

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => {
      expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith("/?view=note");
    });
  });

  it("pushes noteComposer edit query when opening note edit", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    renderAuthedScreen();

    const noteCard = await findTodayLearningNoteCard();
    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));
    await waitFor(() => {
      expect(getNavigationMock().__mockNavigation.getPushMock()).toHaveBeenCalledWith(
        "/?view=note&noteComposer=edit%3Apost-002"
      );
    });
  });

  it("opens login dialog and keeps memo draft on UNAUTHORIZED", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo&stubAuth=1");
    getPostActionsMock().createPostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });

    renderAuthedScreen();

    const input = await screen.findByLabelText("メモ本文");
    await user.type(input, "401でも保持されるメモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインが必要です");
    });
    expect(input).toHaveValue("401でも保持されるメモ");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
  });

  it("keeps note input and opens login dialog on UNAUTHORIZED", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note&stubAuth=1");
    getPostActionsMock().updatePostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });

    renderAuthedScreen();

    const noteCard = await findTodayLearningNoteCard();
    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));
    const titleInput = screen.getByLabelText("ノートタイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "401でも保持されるノートタイトル");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインが必要です");
    });
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
    expect(screen.getByLabelText("ノートタイトル")).toHaveValue("401でも保持されるノートタイトル");
  });

  it("opens login dialog even when relogin draft persistence fails on UNAUTHORIZED", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");
    getPostActionsMock().createPostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });
    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      key: string,
      value: string
    ) {
      if (key === "mono-log:relogin-draft:v1") {
        throw new Error("sessionStorage unavailable");
      }

      return originalSetItem.call(this, key, value);
    });

    renderAuthedScreen({ authMode: "authjs" });

    const input = await screen.findByLabelText("メモ本文");
    await user.type(input, "401でも保持されるメモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインが必要です");
    });
    expect(setItemSpy).toHaveBeenCalled();
    expect(input).toHaveValue("401でも保持されるメモ");
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
  });

  it("allows continuing memo save after login flow", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo&stubAuth=1");
    getPostActionsMock().createPostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });

    renderAuthedScreen();

    const input = await screen.findByLabelText("メモ本文");
    await user.type(input, "ログイン後に保存するメモ");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインが必要です");
    });
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
    expect(input).toHaveValue("ログイン後に保存するメモ");

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "ログイン" })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() => {
      expect(getPostActionsMock().createPostAction).toHaveBeenCalledTimes(2);
    });
    expect(toast).toHaveBeenCalledWith("保存しました");
    expect(screen.getByText("ログイン後に保存するメモ")).toBeInTheDocument();
  });

  it("allows continuing note update after login flow", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note&stubAuth=1");
    getPostActionsMock().updatePostAction.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "ログインが必要です",
      },
    });

    renderAuthedScreen();

    const noteCard = await findTodayLearningNoteCard();
    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));
    const titleInput = screen.getByLabelText("ノートタイトル");
    await user.clear(titleInput);
    await user.type(titleInput, "ログイン後に更新するノート");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ログインが必要です");
    });
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
    expect(screen.getByLabelText("ノートタイトル")).toHaveValue("ログイン後に更新するノート");

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "ログイン" })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "更新する" }));
    await waitFor(() => {
      expect(getPostActionsMock().updatePostAction).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith("更新しました");
    });
    expect(screen.queryByLabelText("ノートタイトル")).not.toBeInTheDocument();
  });
});
