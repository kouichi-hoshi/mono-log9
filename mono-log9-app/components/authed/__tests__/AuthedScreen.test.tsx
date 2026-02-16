import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthedScreen from "@/components/authed/AuthedScreen";
import { toast } from "sonner";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

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

describe("AuthedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getNavigationMock().__mockNavigation.reset();
  });

  it("replaces missing view query with view=memo on initial render", () => {
    render(<AuthedScreen logoutUrl="/" />);

    expect(getNavigationMock().__mockNavigation.getReplaceMock()).toHaveBeenCalledWith(
      "/?view=memo"
    );
    expect(screen.getByRole("heading", { level: 2, name: "メモ" })).toBeInTheDocument();
  });

  it("does not replace for already-valid query even when key order is non-canonical", () => {
    getNavigationMock().__mockNavigation.setQuery("view=note&stubAuth=1&favoriteNote");

    render(<AuthedScreen logoutUrl="/" />);

    expect(getNavigationMock().__mockNavigation.getReplaceMock()).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 2, name: "ノート" })).toBeInTheDocument();
  });

  it("renders trash view from initial query", () => {
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByRole("heading", { level: 2, name: "ごみ箱" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ごみ箱" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders note view and favorite active from initial query", () => {
    getNavigationMock().__mockNavigation.setQuery("view=note&favoriteNote");

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByRole("heading", { level: 2, name: "ノート" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ノート" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "お気に入り", pressed: true })).toBeInTheDocument();
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

  it("does not push on no-op view action", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ノート" }));

    expect(getNavigationMock().__mockNavigation.getPushMock()).not.toHaveBeenCalled();
  });

  it("fires stub toast when clicking trash item action buttons", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getAllByRole("button", { name: "復元" })[0]);
    await user.click(screen.getAllByRole("button", { name: "完全に削除" })[0]);

    expect(toast).toHaveBeenCalledWith("未実装です");
    expect((toast as jest.Mock).mock.calls).toHaveLength(2);
  });

  it("shows bulk actions and updates selected count from row checkbox", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));

    expect(screen.getByText("1件選択中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeEnabled();
  });

  it("toggles all visible trash post selections", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=trash");

    render(<AuthedScreen logoutUrl="/" />);

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

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    expect(screen.getByText("1件選択中")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "メモ" }));
    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.queryByText("1件選択中")).not.toBeInTheDocument();
    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
  });

  it("opens inline memo edit and returns to normal view on cancel", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=memo");

    render(<AuthedScreen logoutUrl="/" />);

    const memoCard = screen
      .getByText("買い物メモ: 牛乳、パン、トマト")
      .closest("article");

    if (!memoCard) {
      throw new Error("memo card not found");
    }

    await user.click(within(memoCard).getByRole("button", { name: "編集" }));

    expect(within(memoCard).getByRole("button", { name: "更新する" })).toBeInTheDocument();

    await user.click(within(memoCard).getByRole("button", { name: "キャンセル" }));

    expect(within(memoCard).queryByRole("button", { name: "更新する" })).not.toBeInTheDocument();
  });

  it("opens note edit modal from note card", async () => {
    const user = userEvent.setup();
    getNavigationMock().__mockNavigation.setQuery("view=note");

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByRole("button", { name: "ノートを書く" })).toBeInTheDocument();

    const noteCard = screen.getByText(/今日の学び/).closest("article");

    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));

    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });
});
