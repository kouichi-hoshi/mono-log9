"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Extension,
  textblockTypeInputRule,
  type JSONContent,
} from "@tiptap/core";

import LinkDialog from "@/components/authed/LinkDialog";
import NoteToolbar from "@/components/authed/NoteToolbar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const HeadingShortcutExtension = Extension.create({
  name: "headingShortcutExtension",
  addInputRules() {
    const headingType = this.editor.schema.nodes.heading;

    if (!headingType) {
      return [];
    }

    return [
      textblockTypeInputRule({
        find: /^(#)\s$/,
        type: headingType,
        getAttributes: { level: 2 },
      }),
    ];
  },
});

type NoteEditorProps = {
  title: string;
  onTitleChange: (nextTitle: string) => void;
  contentJson: JSONContent | null;
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
  contentJson,
  onContentStateChange,
  showValidationError = false,
  onClearValidationError,
}: NoteEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [showLinkSelectionError, setShowLinkSelectionError] = React.useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: {},
        code: false,
        codeBlock: false,
        heading: {
          levels: [2, 3, 4],
        },
        horizontalRule: false,
        italic: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
        },
        strike: false,
      }),
      Placeholder.configure({
        placeholder: "ノートを書く",
      }),
      HeadingShortcutExtension,
    ],
    content: contentJson ?? "",
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        "aria-label": "ノート本文",
        "data-testid": "note-editor-input",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onContentStateChange({
        contentJson: nextEditor.getJSON(),
        plainText: nextEditor.getText(),
      });

      if (showValidationError) {
        onClearValidationError?.();
      }

      if (showLinkSelectionError) {
        setShowLinkSelectionError(false);
      }
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getJSON();
    const next = contentJson ?? { type: "doc", content: [] };
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [contentJson, editor]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    onContentStateChange({
      contentJson: editor.getJSON(),
      plainText: editor.getText(),
    });
  }, [editor, onContentStateChange]);

  const handleLinkClick = React.useCallback(() => {
    if (!editor) {
      return;
    }

    if (editor.state.selection.empty) {
      setShowLinkSelectionError(true);
      return;
    }

    setShowLinkSelectionError(false);
    setIsLinkDialogOpen(true);
  }, [editor]);

  const handleUnlinkClick = React.useCallback(() => {
    if (!editor) {
      return;
    }

    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkSelectionError(false);
  }, [editor]);

  const handleLinkSubmit = React.useCallback(
    (url: string) => {
      if (!editor) {
        return;
      }

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
        })
        .run();
    },
    [editor]
  );

  return (
    <div className="flex min-h-full flex-col gap-3 p-[3px]">
      <input
        type="text"
        value={title}
        aria-label="ノートタイトル"
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="タイトル（任意）"
        className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      />

      <NoteToolbar
        editor={editor}
        onLinkClick={handleLinkClick}
        onUnlinkClick={handleUnlinkClick}
      />

      <EditorContent
        editor={editor}
        className="flex min-h-0 flex-1 flex-col [&>.tiptap]:flex-1"
      />

      <LinkDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        onSubmit={handleLinkSubmit}
      />

      {showLinkSelectionError && (
        <Alert>
          <AlertDescription>リンクにするテキストを選択してください</AlertDescription>
        </Alert>
      )}

      {showValidationError && (
        <Alert>
          <AlertDescription>内容を入力してください</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
