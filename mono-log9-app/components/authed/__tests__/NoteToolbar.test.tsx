import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Editor } from "@tiptap/react";

import NoteToolbar from "@/components/authed/NoteToolbar";

type ChainMock = {
  focus: jest.Mock;
  toggleHeading: jest.Mock;
  toggleBulletList: jest.Mock;
  toggleOrderedList: jest.Mock;
  toggleBlockquote: jest.Mock;
  toggleBold: jest.Mock;
  run: jest.Mock;
};

function createEditorMock(): { editor: Editor; chain: ChainMock } {
  const chain: Partial<ChainMock> = {};

  chain.focus = jest.fn(() => chain as ChainMock);
  chain.toggleHeading = jest.fn(() => chain as ChainMock);
  chain.toggleBulletList = jest.fn(() => chain as ChainMock);
  chain.toggleOrderedList = jest.fn(() => chain as ChainMock);
  chain.toggleBlockquote = jest.fn(() => chain as ChainMock);
  chain.toggleBold = jest.fn(() => chain as ChainMock);
  chain.run = jest.fn(() => true);

  const editor = {
    chain: jest.fn(() => chain as ChainMock),
    isActive: jest.fn(() => false),
  } as unknown as Editor;

  return { editor, chain: chain as ChainMock };
}

describe("NoteToolbar", () => {
  it("calls heading/list/blockquote/bold commands from toolbar", async () => {
    const user = userEvent.setup();
    const { editor, chain } = createEditorMock();

    render(
      <NoteToolbar
        editor={editor}
        onLinkClick={jest.fn()}
        onUnlinkClick={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "H2" }));
    await user.click(screen.getByRole("button", { name: "箇条書き" }));
    await user.click(screen.getByRole("button", { name: "番号付き" }));
    await user.click(screen.getByRole("button", { name: "引用" }));
    await user.click(screen.getByRole("button", { name: "太字" }));

    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(chain.toggleBulletList).toHaveBeenCalled();
    expect(chain.toggleOrderedList).toHaveBeenCalled();
    expect(chain.toggleBlockquote).toHaveBeenCalled();
    expect(chain.toggleBold).toHaveBeenCalled();
  });

  it("calls link callbacks", async () => {
    const user = userEvent.setup();
    const { editor } = createEditorMock();
    const onLinkClick = jest.fn();
    const onUnlinkClick = jest.fn();

    render(
      <NoteToolbar
        editor={editor}
        onLinkClick={onLinkClick}
        onUnlinkClick={onUnlinkClick}
      />
    );

    await user.click(screen.getByRole("button", { name: "リンク" }));
    await user.click(screen.getByRole("button", { name: "リンク解除" }));

    expect(onLinkClick).toHaveBeenCalledTimes(1);
    expect(onUnlinkClick).toHaveBeenCalledTimes(1);
  });

  it("reflects active formatting state with aria-pressed and active classes", () => {
    const { editor } = createEditorMock();
    (editor.isActive as jest.Mock).mockImplementation((name: string, attrs?: { level?: number }) => {
      if (name === "heading" && attrs?.level === 2) {
        return true;
      }

      if (name === "bold") {
        return true;
      }

      if (name === "link") {
        return true;
      }

      return false;
    });

    render(
      <NoteToolbar
        editor={editor}
        onLinkClick={jest.fn()}
        onUnlinkClick={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "H2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "H2" })).toHaveClass("border-foreground/50");
    expect(screen.getByRole("button", { name: "太字" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "太字" })).toHaveClass("bg-foreground/10");
    expect(screen.getByRole("button", { name: "リンク解除" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "リンク" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "H3" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "箇条書き" })).toHaveAttribute("aria-pressed", "false");
  });
});
