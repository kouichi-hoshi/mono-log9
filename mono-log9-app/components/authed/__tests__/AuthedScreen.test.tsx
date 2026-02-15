import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthedScreen from "@/components/authed/AuthedScreen";
import { toast } from "sonner";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

describe("AuthedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("switches to trash view and updates active button states", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    expect(screen.getByRole("button", { name: "メモ" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ノート" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ごみ箱" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.getByRole("button", { name: "メモ" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ノート" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ごみ箱" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 2, name: "ごみ箱" })).toBeInTheDocument();
  });

  it("keeps trash view unchanged when trash button is clicked again", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    expect(screen.getByRole("heading", { level: 2, name: "ごみ箱" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    expect(screen.getByRole("heading", { level: 2, name: "ごみ箱" })).toBeInTheDocument();
  });

  it("returns to note list when note button is clicked from trash view", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await user.click(screen.getByRole("button", { name: "ノート" }));

    expect(screen.getByRole("button", { name: "メモ" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ノート" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ごみ箱" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { level: 2, name: "ノート" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ノートを書く" })).toBeInTheDocument();
  });

  it("returns to memo list when memo button is clicked from trash view", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await user.click(screen.getByRole("button", { name: "メモ" }));

    expect(screen.getByRole("button", { name: "メモ" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "ノート" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "ごみ箱" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { level: 2, name: "メモ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
  });

  it("shows trash item action buttons in trash view", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.queryByRole("button", { name: "お気に入り" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "編集" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "削除" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "復元" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "完全に削除" })).toHaveLength(3);
  });

  it("fires stub toast when clicking trash item action buttons", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    await user.click(screen.getAllByRole("button", { name: "復元" })[0]);
    await user.click(screen.getAllByRole("button", { name: "完全に削除" })[0]);

    expect(toast).toHaveBeenCalledWith("未実装です");
    expect((toast as jest.Mock).mock.calls).toHaveLength(2);
  });

  it("shows bulk actions and updates selected count from row checkbox", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));

    expect(screen.getByText("1件選択中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeEnabled();
  });

  it("toggles all visible trash post selections", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    await user.click(screen.getByRole("checkbox", { name: "表示中の投稿を選択" }));

    expect(screen.getByText("3件選択中")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "選択を解除" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "選択を解除" }));

    expect(screen.queryByText("3件選択中")).not.toBeInTheDocument();
    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
  });

  it("opens selected-delete confirmation dialog and shows stub toast on confirm", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    await user.click(screen.getByRole("button", { name: "選択した投稿を削除" }));

    expect(screen.getByText("1件の投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(toast).toHaveBeenCalledWith("未実装です");
  });

  it("opens empty-trash confirmation dialog and shows stub toast on confirm", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await user.click(screen.getByRole("button", { name: "ごみ箱を空にする" }));

    expect(screen.getByText("ごみ箱内のすべての投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(toast).toHaveBeenCalledWith("未実装です");
  });

  it("resets trash selections when leaving trash view", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));
    await user.click(screen.getByRole("checkbox", { name: "trash-001を選択" }));
    expect(screen.getByText("1件選択中")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "メモ" }));
    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.queryByText("1件選択中")).not.toBeInTheDocument();
    expect(screen.getByText("表示中の投稿を選択")).toBeInTheDocument();
  });

  it("opens inline memo edit and returns to normal view on cancel", async () => {
    const user = userEvent.setup();

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

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ノート" }));

    expect(screen.getByRole("button", { name: "ノートを書く" })).toBeInTheDocument();

    const noteCard = screen.getByText(/今日の学び/).closest("article");

    if (!noteCard) {
      throw new Error("note card not found");
    }

    await user.click(within(noteCard).getByRole("button", { name: "編集" }));

    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });
});
