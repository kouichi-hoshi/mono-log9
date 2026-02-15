"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type MemoEditorProps = {
  value: string;
  onValueChange: (nextValue: string) => void;
  onSave: (value: string) => void;
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
  const [showInternalAlert, setShowInternalAlert] = React.useState(false);
  const showAlert = showInternalAlert || showValidationError;

  const handleSave = () => {
    if (value.trim().length === 0) {
      setShowInternalAlert(true);
      return;
    }

    setShowInternalAlert(false);
    onSave(value);
    if (!isEditing) {
      onValueChange("");
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
          type="text"
          value={value}
          aria-label="メモ本文"
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
          >
            キャンセル
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-w-24 px-4"
          onClick={handleSave}
        >
          {isEditing ? "更新する" : "保存する"}
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
