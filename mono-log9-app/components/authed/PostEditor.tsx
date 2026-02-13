"use client";

import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PostMode } from "@/components/authed/stubs";

type PostEditorProps = {
  mode: PostMode;
  isEditing?: boolean;
  value?: string;
  onValueChange?: (nextValue: string) => void;
  showActions?: boolean;
  showValidationError?: boolean;
  onClearValidationError?: () => void;
};

export default function PostEditor({
  mode,
  isEditing = false,
  value: valueProp,
  onValueChange,
  showActions = true,
  showValidationError = false,
  onClearValidationError,
}: PostEditorProps) {
  const [internalValue, setInternalValue] = React.useState("");
  const [showInternalAlert, setShowInternalAlert] = React.useState(false);

  const value = valueProp ?? internalValue;
  const showAlert = showInternalAlert || showValidationError;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, valueProp]
  );

  const handleSave = () => {
    if (value.trim().length === 0) {
      setShowInternalAlert(true);
      return;
    }

    setShowInternalAlert(false);
    toast("未実装です");
  };

  const handleCancel = () => {
    setValue("");
    setShowInternalAlert(false);
    toast("未実装です");
  };

  if (mode === "note") {
    return (
      <>
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (showAlert) {
              setShowInternalAlert(false);
              onClearValidationError?.();
            }
          }}
          placeholder="ノートを書く"
          rows={12}
          className="h-full min-h-56 w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        />

        {showAlert && (
          <Alert className="mt-3">
            <AlertDescription>内容を入力してください</AlertDescription>
          </Alert>
        )}

        {showActions && (
          <div className="mt-3 flex justify-end gap-2">
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
            )}
            <Button type="button" className="min-w-24" onClick={handleSave}>
              {isEditing ? "更新" : "保存"}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
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
          {isEditing ? "更新" : "保存"}
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
