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
};

export default function PostEditor({
  mode,
  isEditing = false,
  value: valueProp,
  onValueChange,
}: PostEditorProps) {
  const [internalValue, setInternalValue] = React.useState("");
  const [showAlert, setShowAlert] = React.useState(false);

  const value = valueProp ?? internalValue;

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
      setShowAlert(true);
      return;
    }

    setShowAlert(false);
    toast("未実装です");
  };

  const handleCancel = () => {
    setValue("");
    setShowAlert(false);
    toast("未実装です");
  };

  if (mode === "note") {
    return (
      <div className="rounded-lg border border-foreground/10 p-3">
        <div>
          <textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (showAlert) {
                setShowAlert(false);
              }
            }}
            placeholder="ノートを書く"
            rows={12}
            className="min-h-56 w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
        </div>

        {showAlert && (
          <Alert className="mt-3">
            <AlertDescription>内容を入力してください</AlertDescription>
          </Alert>
        )}

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
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (showAlert) {
              setShowAlert(false);
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
          {isEditing ? "更新" : "追加"}
        </Button>
      </div>

      {showAlert && (
        <Alert className="mt-3">
          <AlertDescription>内容を入力してください</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
