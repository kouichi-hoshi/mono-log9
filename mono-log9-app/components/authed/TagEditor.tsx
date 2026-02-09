"use client";

import { useState } from "react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import { Button } from "@/components/ui/button";

type TagEditorProps = {
  placeholder?: string;
};

export default function TagEditor({ placeholder = "タグを追加" }: TagEditorProps) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground/70">タグエディタ</p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="h-10 flex-1 rounded-md border border-foreground/15 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => notifyNotImplemented("タグを追加")}
        >
          追加
        </Button>
      </div>
    </div>
  );
}
