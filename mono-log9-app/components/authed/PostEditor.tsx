"use client";

import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PostMode } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";

type PostEditorProps = {
  mode: PostMode;
  isEditing?: boolean;
  value?: string;
  onValueChange?: (nextValue: string) => void;
  expanded?: boolean;
  onExpandedChange?: (nextExpanded: boolean) => void;
};

export default function PostEditor({
  mode,
  isEditing = false,
  value: valueProp,
  onValueChange,
  expanded: expandedProp,
  onExpandedChange,
}: PostEditorProps) {
  const [internalValue, setInternalValue] = React.useState("");
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);

  const value = valueProp ?? internalValue;
  const expanded = expandedProp ?? internalExpanded;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, valueProp]
  );

  const setExpanded = React.useCallback(
    (nextExpanded: boolean) => {
      if (expandedProp === undefined) {
        setInternalExpanded(nextExpanded);
      }
      onExpandedChange?.(nextExpanded);
    },
    [expandedProp, onExpandedChange]
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

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const renderNoteEditor = (fullscreen: boolean) => (
    <div
      className={cn(
        fullscreen
          ? "flex h-full flex-col bg-background p-4 md:p-6"
          : "rounded-lg border border-foreground/10 p-3"
      )}
    >
      <div className="flex items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggleExpanded}
        >
          {fullscreen ? "戻す" : "拡大"}
        </Button>
      </div>

      <div className="mt-2 flex-1">
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (showAlert) {
              setShowAlert(false);
            }
          }}
          placeholder="ノートを書く"
          rows={fullscreen ? 18 : 5}
          className={cn(
            "w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
            fullscreen ? "h-full min-h-[60vh]" : "min-h-56"
          )}
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

  if (mode === "note") {
    return (
      <>
        {!expanded && renderNoteEditor(false)}
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 [&>button[aria-label='閉じる']]:hidden">
            <DialogTitle className="sr-only">ノートエディタ（全画面）</DialogTitle>
            {renderNoteEditor(true)}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="rounded-lg border border-foreground/10 p-3">
      <div>
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
          className="h-11 w-full rounded-md border border-foreground/20 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        />
      </div>

      {showAlert && (
        <Alert className="mt-3">
          <AlertDescription>内容を入力してください</AlertDescription>
        </Alert>
      )}

      <div className="mt-3 flex gap-2">
        {isEditing && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={handleSave}>
          {isEditing ? "更新" : "保存"}
        </Button>
      </div>
    </div>
  );
}
