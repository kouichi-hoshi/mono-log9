import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthedScreen from "@/components/authed/AuthedScreen";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

describe("AuthedScreen", () => {
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
