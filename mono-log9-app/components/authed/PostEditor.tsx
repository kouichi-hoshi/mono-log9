"use client";

import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PostMode } from "@/components/authed/stubs";

type PostEditorProps = {
  mode: PostMode;
  isEditing?: boolean;
};

export default function PostEditor({ mode, isEditing = false }: PostEditorProps) {
  const [value, setValue] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);

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

  return (
    <div className="rounded-lg border border-foreground/10 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground/60">投稿エディタ</p>
        {mode === "note" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "戻す" : "拡大"}
          </Button>
        )}
      </div>

      <div className="mt-2">
        {mode === "memo" ? (
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (showAlert) {
                setShowAlert(false);
              }
            }}
            placeholder="メモを入力"
            className="h-11 w-full rounded-md border border-foreground/20 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
        ) : (
          <textarea
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (showAlert) {
                setShowAlert(false);
              }
            }}
            placeholder="ノートを入力"
            rows={expanded ? 10 : 5}
            className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
        )}
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
