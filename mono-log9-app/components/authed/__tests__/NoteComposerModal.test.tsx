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

  it("requests close to parent when close is clicked", async () => {
    const user = userEvent.setup();
    const onRequestClose = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <NoteComposerModal
        open
        onOpenChange={onOpenChange}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
        onRequestClose={onRequestClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("closes directly when onRequestClose is not provided", async () => {
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

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("notifies dirty state changes while open", async () => {
    const user = userEvent.setup();
    const onDirtyChange = jest.fn();

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
        onDirtyChange={onDirtyChange}
      />
    );

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(false);
    });

    await user.type(screen.getByLabelText("ノートタイトル"), "下書き");

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  it("notifies clean state when modal closes", async () => {
    const onDirtyChange = jest.fn();
    const { rerender } = render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
        onDirtyChange={onDirtyChange}
      />
    );

    rerender(
      <NoteComposerModal
        open={false}
        onOpenChange={jest.fn()}
        mode="create"
        onSaveStub={jest.fn().mockResolvedValue(true)}
        onDirtyChange={onDirtyChange}
      />
    );

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(false);
    });
  });

  it("keeps modal open when save fails", async () => {
    const user = userEvent.setup();
    const onSaveStub = jest.fn().mockResolvedValue(false);

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="edit"
        initialContentJson={createDocFromPlainText("既存ノート本文")}
        initialPlainText="既存ノート本文"
        onSaveStub={onSaveStub}
      />
    );

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(onSaveStub).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });
});
