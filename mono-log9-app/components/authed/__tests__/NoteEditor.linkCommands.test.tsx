import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NoteEditor from "@/components/authed/NoteEditor";

type ChainMock = {
  focus: jest.Mock;
  extendMarkRange: jest.Mock;
  setLink: jest.Mock;
  unsetLink: jest.Mock;
  run: jest.Mock;
};

const useEditorMock = jest.fn();

jest.mock("@tiptap/react", () => ({
  EditorContent: () => <div data-testid="mock-editor-content" />,
  useEditor: (...args: unknown[]) => useEditorMock(...args),
}));

function createEditorMock() {
  const chain: Partial<ChainMock> = {};

  chain.focus = jest.fn(() => chain as ChainMock);
  chain.extendMarkRange = jest.fn(() => chain as ChainMock);
  chain.setLink = jest.fn(() => chain as ChainMock);
  chain.unsetLink = jest.fn(() => chain as ChainMock);
  chain.run = jest.fn(() => true);

  const editor = {
    state: {
      selection: {
        empty: false,
      },
    },
    commands: {
      setContent: jest.fn(),
    },
    getHTML: jest.fn(() => "<p>本文</p>"),
    getJSON: jest.fn(() => ({ type: "doc", content: [] })),
    getText: jest.fn(() => "本文"),
    isActive: jest.fn(() => false),
    chain: jest.fn(() => chain),
  };

  return { editor, chain: chain as ChainMock };
}

describe("NoteEditor link commands", () => {
  beforeEach(() => {
    useEditorMock.mockReset();
  });

  it("applies and removes link through toolbar actions", async () => {
    const user = userEvent.setup();
    const { editor, chain } = createEditorMock();
    useEditorMock.mockReturnValue(editor);

    render(
      <NoteEditor
        title=""
        onTitleChange={jest.fn()}
        contentJson={{ type: "doc", content: [] }}
        onContentStateChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "リンク" }));

    await user.type(screen.getByLabelText("リンクURL"), "example.com");
    await user.click(screen.getByRole("button", { name: "適用" }));

    expect(chain.setLink).toHaveBeenCalledWith({
      href: "https://example.com/",
      target: "_blank",
      rel: "noopener noreferrer",
    });

    await user.click(screen.getByRole("button", { name: "リンク解除" }));

    expect(chain.unsetLink).toHaveBeenCalledTimes(1);
  });

  it("configures markdown-related editor extensions", () => {
    const { editor } = createEditorMock();
    useEditorMock.mockReturnValue(editor);

    render(
      <NoteEditor
        title=""
        onTitleChange={jest.fn()}
        contentJson={{ type: "doc", content: [] }}
        onContentStateChange={jest.fn()}
      />
    );

    const options = useEditorMock.mock.calls[0][0] as {
      extensions: Array<{ name?: string; options?: Record<string, unknown> }>;
    };
    const extensionByName = new Map(
      options.extensions.map((extension) => [extension.name, extension] as const)
    );

    const starterKit = extensionByName.get("starterKit");
    expect(starterKit).toBeDefined();
    expect(starterKit?.options?.heading).toEqual({ levels: [2, 3, 4] });
    expect(starterKit?.options?.link).toEqual(
      expect.objectContaining({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      })
    );

    expect(extensionByName.get("headingShortcutExtension")).toBeDefined();
  });
});
