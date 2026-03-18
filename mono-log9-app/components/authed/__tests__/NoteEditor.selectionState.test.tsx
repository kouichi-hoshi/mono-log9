import { act, render, screen } from "@testing-library/react";

import NoteEditor from "@/components/authed/NoteEditor";

const useEditorMock = jest.fn();

jest.mock("@tiptap/react", () => ({
  EditorContent: () => <div data-testid="mock-editor-content" />,
  useEditor: (...args: unknown[]) => useEditorMock(...args),
}));

function createEditorMock() {
  const activeState = {
    bold: false,
    link: false,
  };

  const editor = {
    state: {
      selection: {
        empty: false,
      },
    },
    commands: {
      setContent: jest.fn(),
    },
    getJSON: jest.fn(() => ({ type: "doc", content: [] })),
    getText: jest.fn(() => "本文"),
    isActive: jest.fn((name: string) => {
      if (name === "bold") {
        return activeState.bold;
      }

      if (name === "link") {
        return activeState.link;
      }

      return false;
    }),
    chain: jest.fn(),
  };

  return { editor, activeState };
}

describe("NoteEditor toolbar selection state", () => {
  beforeEach(() => {
    useEditorMock.mockReset();
  });

  it("re-renders toolbar active state when the selection changes", () => {
    const { editor, activeState } = createEditorMock();
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
      onSelectionUpdate?: () => void;
    };

    expect(screen.getByRole("button", { name: "太字" })).toHaveAttribute("aria-pressed", "false");

    activeState.bold = true;
    act(() => {
      options.onSelectionUpdate?.();
    });

    expect(screen.getByRole("button", { name: "太字" })).toHaveAttribute("aria-pressed", "true");

    activeState.bold = false;
    act(() => {
      options.onSelectionUpdate?.();
    });

    expect(screen.getByRole("button", { name: "太字" })).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the link button inactive while unlink reflects link selection state", () => {
    const { editor, activeState } = createEditorMock();
    activeState.link = true;
    useEditorMock.mockReturnValue(editor);

    render(
      <NoteEditor
        title=""
        onTitleChange={jest.fn()}
        contentJson={{ type: "doc", content: [] }}
        onContentStateChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "リンク" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "リンク解除" })).toHaveAttribute("aria-pressed", "true");
  });
});
