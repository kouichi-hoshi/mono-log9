"use client";

import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NoteToolbarProps = {
  editor: Editor | null;
  onLinkClick: () => void;
  onUnlinkClick: () => void;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

function ToolbarButton({ label, onClick, active = false, disabled = false }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn("h-8 px-2", active && "border-foreground/50 bg-foreground/10")}
    >
      {label}
    </Button>
  );
}

export default function NoteToolbar({ editor, onLinkClick, onUnlinkClick }: NoteToolbarProps) {
  const hasEditor = Boolean(editor);

  return (
    <div className="flex flex-wrap gap-2" aria-label="ノートツールバー">
      <ToolbarButton
        label="H2"
        disabled={!hasEditor}
        active={editor?.isActive("heading", { level: 2 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="H3"
        disabled={!hasEditor}
        active={editor?.isActive("heading", { level: 3 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="H4"
        disabled={!hasEditor}
        active={editor?.isActive("heading", { level: 4 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
      />
      <ToolbarButton
        label="箇条書き"
        disabled={!hasEditor}
        active={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="番号付き"
        disabled={!hasEditor}
        active={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="引用"
        disabled={!hasEditor}
        active={editor?.isActive("blockquote")}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="太字"
        disabled={!hasEditor}
        active={editor?.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />
      <ToolbarButton label="リンク" disabled={!hasEditor} onClick={onLinkClick} />
      <ToolbarButton
        label="リンク解除"
        disabled={!hasEditor}
        active={editor?.isActive("link")}
        onClick={onUnlinkClick}
      />
    </div>
  );
}
