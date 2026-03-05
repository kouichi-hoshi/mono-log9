"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type MemoEditorProps = {
  value: string;
  onValueChange: (nextValue: string) => void;
  onSave: (value: string) => Promise<boolean> | boolean;
  isEditing?: boolean;
  onCancel?: () => void;
  showValidationError?: boolean;
  onClearValidationError?: () => void;
};

export default function MemoEditor({
  value,
  onValueChange,
  onSave,
  isEditing = false,
  onCancel,
  showValidationError = false,
  onClearValidationError,
}: MemoEditorProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [showInternalAlert, setShowInternalAlert] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const showAlert = showInternalAlert || showValidationError;

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (value.trim().length === 0) {
      setShowInternalAlert(true);
      return;
    }

    setShowInternalAlert(false);
    setIsSaving(true);
    let saved = false;
    try {
      saved = await onSave(value);
    } finally {
      setIsSaving(false);
    }
    if (saved && !isEditing) {
      onValueChange("");
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    setShowInternalAlert(false);
    onCancel?.();
  };

  return (
    <>
      <div className="flex items-stretch gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          aria-label="メモ本文"
          disabled={isSaving}
          onChange={(event) => {
            onValueChange(event.target.value);
            if (showAlert) {
              setShowInternalAlert(false);
              onClearValidationError?.();
            }
          }}
          placeholder="メモを書く"
          className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        />
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            className="min-w-24 px-4"
            onClick={handleCancel}
            disabled={isSaving}
          >
            キャンセル
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-w-24 px-4"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : isEditing ? "更新する" : "保存する"}
        </Button>
      </div>

      {showAlert && (
        <Alert className="mt-3">
          <AlertDescription>内容を入力してください</AlertDescription>
        </Alert>
      )}
    </>
  );
}
