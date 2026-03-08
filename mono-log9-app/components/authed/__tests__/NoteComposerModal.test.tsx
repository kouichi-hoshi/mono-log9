import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NoteComposerModal, { EMPTY_DRAFT } from "@/components/authed/NoteComposerModal";
import { createDocFromPlainText } from "@/lib/posts/content";
import type { NoteDraft } from "@/components/authed/types";

describe("NoteComposerModal", () => {
  it("shows validation alert when note body is empty", async () => {
    const user = userEvent.setup();

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        draft={{ ...EMPTY_DRAFT }}
        onDraftChange={jest.fn()}
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
        draft={{ ...EMPTY_DRAFT }}
        onDraftChange={jest.fn()}
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
        draft={{ ...EMPTY_DRAFT }}
        onDraftChange={jest.fn()}
        onSaveStub={jest.fn().mockResolvedValue(true)}
      />
    );

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onDraftChange when user types in title", async () => {
    const user = userEvent.setup();
    const onDraftChange = jest.fn();

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        draft={{ ...EMPTY_DRAFT }}
        onDraftChange={onDraftChange}
        onSaveStub={jest.fn().mockResolvedValue(true)}
      />
    );

    await user.type(screen.getByLabelText("ノートタイトル"), "test");

    expect(onDraftChange).toHaveBeenCalled();
    const calls = onDraftChange.mock.calls;
    const lastDraft = calls[calls.length - 1][0];
    expect(lastDraft.title).toBeDefined();
    expect("test").toContain(lastDraft.title);
  });

  it("keeps modal open when save fails", async () => {
    const user = userEvent.setup();
    const onSaveStub = jest.fn().mockResolvedValue(false);
    const draft: NoteDraft = {
      title: "",
      contentJson: createDocFromPlainText("既存ノート本文"),
      plainText: "既存ノート本文",
    };

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="edit"
        draft={draft}
        onDraftChange={jest.fn()}
        onSaveStub={onSaveStub}
      />
    );

    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => {
      expect(onSaveStub).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
  });

  it("displays draft from parent and calls onDraftChange when user edits", async () => {
    const user = userEvent.setup();
    const onDraftChange = jest.fn();
    const initialDraft: NoteDraft = {
      title: "初期タイトル",
      contentJson: createDocFromPlainText("初期本文"),
      plainText: "初期本文",
    };

    render(
      <NoteComposerModal
        open
        onOpenChange={jest.fn()}
        mode="create"
        draft={initialDraft}
        onDraftChange={onDraftChange}
        onSaveStub={jest.fn().mockResolvedValue(true)}
      />
    );

    expect(screen.getByLabelText("ノートタイトル")).toHaveValue("初期タイトル");

    await user.clear(screen.getByLabelText("ノートタイトル"));
    await user.type(screen.getByLabelText("ノートタイトル"), "new");

    expect(onDraftChange).toHaveBeenCalled();
    const calls = onDraftChange.mock.calls;
    const editedTitles = calls.map((c) => c[0].title).filter((t) => t !== "初期タイトル");
    expect(editedTitles.length).toBeGreaterThan(0);
  });
});
