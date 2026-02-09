"use client";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import TagCloud from "@/components/authed/TagCloud";
import TagEditor from "@/components/authed/TagEditor";
import type { Tag } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PostEditorProps = {
  tags: Tag[];
};

export default function PostEditor({ tags }: PostEditorProps) {
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-foreground/10 bg-background/80 p-4",
        expanded && "shadow-lg"
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">投稿エディタ</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const nextExpanded = !expanded;
            setExpanded(nextExpanded);
            notifyNotImplemented(nextExpanded ? "エディタを拡大" : "エディタを戻す");
          }}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {expanded ? "戻す" : "拡大"}
        </Button>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="今日のログを入力"
        className={cn(
          "w-full resize-none rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
          expanded ? "min-h-[160px]" : "min-h-[96px]"
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => notifyNotImplemented(editing ? "更新する" : "保存する")}
        >
          {editing ? "更新する" : "保存する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditing(true);
            notifyNotImplemented("編集モードにする");
          }}
        >
          編集する
        </Button>
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              notifyNotImplemented("編集をキャンセル");
            }}
          >
            キャンセル
          </Button>
        ) : null}
      </div>
      <TagEditor />
      <TagCloud tags={tags} label="タグクラウド" />
    </div>
  );
}
