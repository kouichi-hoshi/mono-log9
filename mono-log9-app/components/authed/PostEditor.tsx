"use client";

import { useState } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Mode } from "@/components/authed/ModeToggle";

type PostEditorProps = {
  mode: Mode;
};

export default function PostEditor({ mode }: PostEditorProps) {
  const [text, setText] = useState("");
  const modeLabel = mode === "memo" ? "メモ" : "ノート";
  const placeholder =
    mode === "memo"
      ? "今日のメモをまとめる"
      : "ノートの内容を整理する";

  const handleSubmit = () => {
    toast("未実装です（投稿保存）");
  };

  return (
    <div className="space-y-3 rounded-lg border border-foreground/10 bg-background px-3 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">新規{modeLabel}</p>
        <button
          className="text-xs font-medium text-foreground/60 hover:text-foreground"
          type="button"
          onClick={() => {
            setText("");
            toast("未実装です（入力クリア）");
          }}
        >
          クリア
        </button>
      </div>
      <textarea
        className="min-h-[88px] w-full resize-none rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast("未実装です（添付）")}
        >
          <Paperclip className="h-4 w-4" />
          添付
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast("未実装です（更新）")}
          >
            更新
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast("未実装です（キャンセル）")}
          >
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            <SendHorizontal className="h-4 w-4" />
            保存する
          </Button>
        </div>
      </div>
    </div>
  );
}
