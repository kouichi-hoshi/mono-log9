"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";

import { Alert, AlertDescription } from "@/components/ui/alert";

type NoteEditorProps = {
  title: string;
  onTitleChange: (nextTitle: string) => void;
  content: string;
  onContentChange: (nextContent: string) => void;
  onContentStateChange: (nextState: {
    contentJson: JSONContent | null;
    plainText: string;
  }) => void;
  showValidationError?: boolean;
  onClearValidationError?: () => void;
};

export default function NoteEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  onContentStateChange,
  showValidationError = false,
  onClearValidationError,
}: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "ノートを書く",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-56 rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        "aria-label": "ノート本文",
        "data-testid": "note-editor-input",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onContentChange(nextEditor.getHTML());
      onContentStateChange({
        contentJson: nextEditor.getJSON(),
        plainText: nextEditor.getText(),
      });
      if (showValidationError) {
        onClearValidationError?.();
      }
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    onContentStateChange({
      contentJson: editor.getJSON(),
      plainText: editor.getText(),
    });
  }, [editor, onContentStateChange]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        aria-label="ノートタイトル"
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="タイトル（任意）"
        className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      />

      <EditorContent editor={editor} />

      {showValidationError && (
        <Alert>
          <AlertDescription>内容を入力してください</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
