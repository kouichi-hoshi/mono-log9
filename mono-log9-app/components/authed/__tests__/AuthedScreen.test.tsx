import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthedScreen from "@/components/authed/AuthedScreen";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

describe("AuthedScreen", () => {
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

  it("hides post action buttons in trash view", async () => {
    const user = userEvent.setup();

    render(<AuthedScreen logoutUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ごみ箱" }));

    expect(screen.queryByRole("button", { name: "お気に入り" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "編集" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "削除" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "復元" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "完全に削除" })).not.toBeInTheDocument();
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
