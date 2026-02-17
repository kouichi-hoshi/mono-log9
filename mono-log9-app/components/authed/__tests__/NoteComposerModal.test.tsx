import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NoteComposerModal from "@/components/authed/NoteComposerModal";
import { createDocFromPlainText } from "@/lib/posts/content";

describe("NoteComposerModal", () => {
  it("shows validation alert when note body is empty", async () => {
    const user = userEvent.setup();

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
      />
    );

    await user.click(screen.getByRole("button", { name: "保存する" }));

    expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
  });

  it("shows discard confirmation and closes when confirmed", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(
      <NoteComposerModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
      />
    );

    await user.type(screen.getByLabelText("ノートタイトル"), "下書き");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.getByText("入力中の内容を破棄しますか？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "破棄して閉じる" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls save stub when initial content is present", async () => {
    const user = userEvent.setup();
    const onSaveStub = jest.fn();

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="edit"
        initialContentJson={createDocFromPlainText("既存ノート本文")}
        initialPlainText="既存ノート本文"
        onSaveStub={onSaveStub.mockResolvedValue(true)}
      />
    );

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(onSaveStub).toHaveBeenCalledTimes(1);
    });
  });

});
