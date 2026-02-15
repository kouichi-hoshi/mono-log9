import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Editor } from "@tiptap/react";

import NoteToolbar from "@/components/authed/NoteToolbar";

type ChainMock = {
  focus: jest.Mock;
  toggleHeading: jest.Mock;
  toggleBulletList: jest.Mock;
  toggleOrderedList: jest.Mock;
  toggleBold: jest.Mock;
  run: jest.Mock;
};

function createEditorMock(): { editor: Editor; chain: ChainMock } {
  const chain: Partial<ChainMock> = {};

  chain.focus = jest.fn(() => chain as ChainMock);
  chain.toggleHeading = jest.fn(() => chain as ChainMock);
  chain.toggleBulletList = jest.fn(() => chain as ChainMock);
  chain.toggleOrderedList = jest.fn(() => chain as ChainMock);
  chain.toggleBold = jest.fn(() => chain as ChainMock);
  chain.run = jest.fn(() => true);

  const editor = {
    chain: jest.fn(() => chain as ChainMock),
    isActive: jest.fn(() => false),
  } as unknown as Editor;

  return { editor, chain: chain as ChainMock };
}

describe("NoteToolbar", () => {
  it("calls heading/list/bold commands from toolbar", async () => {
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
    await user.click(screen.getByRole("button", { name: "太字" }));

    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(chain.toggleBulletList).toHaveBeenCalled();
    expect(chain.toggleOrderedList).toHaveBeenCalled();
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
});
