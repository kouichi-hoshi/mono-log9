"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

type EditorActionBarProps = {
  onClose: () => void;
  onSave: () => void;
  closeLabel?: string;
  saveLabel?: string;
  saveDisabled?: boolean;
};

export default function EditorActionBar({
  onClose,
  onSave,
  closeLabel = "閉じる",
  saveLabel = "保存",
  saveDisabled = false,
}: EditorActionBarProps) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onClose}>
        {closeLabel}
      </Button>
      <Button type="button" className="min-w-24" onClick={onSave} disabled={saveDisabled}>
        {saveLabel}
      </Button>
    </div>
  );
}
