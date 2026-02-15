"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type TrashBulkActionsProps = {
  hasSelection: boolean;
  selectedCount: number;
  hasTrashPosts: boolean;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onEmptyTrash: () => void;
};

export default function TrashBulkActions({
  hasSelection,
  selectedCount,
  hasTrashPosts,
  onToggleSelectAll,
  onDeleteSelected,
  onEmptyTrash,
}: TrashBulkActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/10 p-3">
      <label className="mr-auto flex items-center gap-2 text-sm">
        <Checkbox
          checked={hasSelection}
          disabled={!hasTrashPosts}
          aria-label={hasSelection ? "チェックを外す" : "表示されている投稿を選択"}
          onCheckedChange={onToggleSelectAll}
        />
        <span>{hasSelection ? "チェックを外す" : "表示されている投稿を選択"}</span>
      </label>

      {hasSelection && <p className="text-sm text-foreground/80">{selectedCount}件選択中</p>}

      <Button type="button" variant="outline" size="sm" disabled={!hasSelection} onClick={onDeleteSelected}>
        選択した投稿を削除
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={!hasTrashPosts} onClick={onEmptyTrash}>
        ごみ箱を空にする
      </Button>
    </div>
  );
}
