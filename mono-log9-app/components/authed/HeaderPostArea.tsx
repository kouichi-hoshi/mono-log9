"use client";

import * as React from "react";

import MemoEditor from "@/components/authed/MemoEditor";
import type { ViewMode } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";

type HeaderPostAreaProps = {
  viewMode: ViewMode;
  onNoteComposeClick: () => void;
  memoDraft: string;
  onMemoDraftChange: (nextValue: string) => void;
  onMemoSaveStub: (value: string) => Promise<boolean> | boolean;
};

function HeaderPostArea({
  viewMode,
  onNoteComposeClick,
  memoDraft,
  onMemoDraftChange,
  onMemoSaveStub,
}: HeaderPostAreaProps) {
  if (viewMode === "note") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        aria-label="ノートを書く"
        onClick={onNoteComposeClick}
      >
        <PencilLine className="h-4 w-4" />
        <span className="md:hidden">ノート</span>
        <span className="hidden md:inline">ノートを書く</span>
      </Button>
    );
  }

  return (
    <MemoEditor value={memoDraft} onValueChange={onMemoDraftChange} onSave={onMemoSaveStub} />
  );
}

export default React.memo(HeaderPostArea);
