import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSONContent } from "@tiptap/core";

import NoteEditor from "@/components/authed/NoteEditor";

function NoteEditorHarness() {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [state, setState] = React.useState<{ contentJson: JSONContent | null; plainText: string }>({
    contentJson: null,
    plainText: "",
  });

  return (
    <>
      <NoteEditor
        title={title}
        onTitleChange={setTitle}
        content={content}
        onContentChange={setContent}
        onContentStateChange={setState}
      />
      <output data-testid="content-html">{content}</output>
      <output data-testid="content-text">{state.plainText}</output>
    </>
  );
}

describe("NoteEditor", () => {
  it("shows toolbar labels", () => {
    render(<NoteEditorHarness />);

    expect(screen.getByRole("button", { name: "H2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "H3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "H4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "箇条書き" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "番号付き" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "太字" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "リンク" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "リンク解除" })).toBeInTheDocument();
  });

  it("shows selection guard when link is clicked without selecting text", async () => {
    const user = userEvent.setup();

    render(<NoteEditorHarness />);

    await user.click(screen.getByRole("button", { name: "リンク" }));

    expect(screen.getByText("リンクにするテキストを選択してください")).toBeInTheDocument();
  });
});
