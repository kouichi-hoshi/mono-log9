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
    const onSave = jest.fn().mockResolvedValue(true);
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

  it("keeps input when save returns false", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn().mockResolvedValue(false);
    const onValueChange = jest.fn();

    render(
      <MemoEditor
        value="保存失敗メモ"
        onValueChange={onValueChange}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(onSave).toHaveBeenCalledWith("保存失敗メモ");
    expect(onValueChange).not.toHaveBeenCalledWith("");
  });

  it("calls clear validation callback on input change", async () => {
    const user = userEvent.setup();
    const onClearValidationError = jest.fn();
    const onValueChange = jest.fn();

    render(
      <MemoEditor
        value=""
        onValueChange={onValueChange}
        onSave={jest.fn()}
        showValidationError
        onClearValidationError={onClearValidationError}
      />
    );

    await user.type(screen.getByLabelText("メモ本文"), "a");

    expect(onValueChange).toHaveBeenCalled();
    expect(onClearValidationError).toHaveBeenCalledTimes(1);
  });
});
