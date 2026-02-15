import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MemoEditor from "@/components/authed/MemoEditor";

describe("MemoEditor", () => {
  it("shows validation alert when saving empty input", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    render(
      <MemoEditor
        value=""
        onValueChange={jest.fn()}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls save and clears input in create mode", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const onValueChange = jest.fn();

    render(
      <MemoEditor
        value="テストメモ"
        onValueChange={onValueChange}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(onSave).toHaveBeenCalledWith("テストメモ");
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});
