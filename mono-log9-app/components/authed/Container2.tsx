"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import TrashBulkActions from "@/components/authed/TrashBulkActions";
import TrashPostCard from "@/components/authed/TrashPostCard";
import { Button } from "@/components/ui/button";
import type { StubPost, StubTrashPost, ViewMode } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { toast } from "sonner";

type Container2Props = {
  mode: ViewMode;
  isTrashView: boolean;
  favoriteOnly: boolean;
  posts: StubPost[];
  trashPosts: StubTrashPost[];
  onFavoriteToggle: () => void;
  onToggleFavorite: (postId: string) => void;
  onEdit: (postId: string) => void;
  editingMemoPostId: string | null;
  editingMemoValue: string;
  onMemoEditValueChange: (nextValue: string) => void;
  onCancelMemoEdit: () => void;
  onSaveMemoEditStub: (postId: string, value: string) => void;
  selectedTrashPostIds: Set<string>;
  onToggleTrashPostSelection: (postId: string, checked: boolean) => void;
  onSelectAllVisibleTrashPosts: () => void;
  onClearTrashPostSelection: () => void;
  onRequestDeleteSelectedTrashPosts: () => void;
  onRequestEmptyTrash: () => void;
};

export default function Container2({
  mode,
  isTrashView,
  favoriteOnly,
  posts,
  trashPosts,
  onFavoriteToggle,
  onToggleFavorite,
  onEdit,
  editingMemoPostId,
  editingMemoValue,
  onMemoEditValueChange,
  onCancelMemoEdit,
  onSaveMemoEditStub,
  selectedTrashPostIds,
  onToggleTrashPostSelection,
  onSelectAllVisibleTrashPosts,
  onClearTrashPostSelection,
  onRequestDeleteSelectedTrashPosts,
  onRequestEmptyTrash,
}: Container2Props) {
  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    toast("未実装です");
  };

  const hasSelection = selectedTrashPostIds.size > 0;
  const handleToggleSelectAll = () => {
    if (hasSelection) {
      onClearTrashPostSelection();
      return;
    }

    onSelectAllVisibleTrashPosts();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{isTrashView ? "ごみ箱" : mode === "memo" ? "メモ" : "ノート"}</h2>
        {!isTrashView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("ml-auto gap-2", favoriteOnly && "border-amber-400 text-amber-500")}
            onClick={handleFavoriteToggle}
            aria-pressed={favoriteOnly}
          >
            <Star className={cn("h-4 w-4", favoriteOnly && "fill-amber-400")} />
            <span className="text-xs">お気に入り</span>
          </Button>
        )}
      </div>

      {isTrashView && (
        <TrashBulkActions
          hasSelection={hasSelection}
          selectedCount={selectedTrashPostIds.size}
          hasTrashPosts={trashPosts.length > 0}
          onToggleSelectAll={handleToggleSelectAll}
          onDeleteSelected={onRequestDeleteSelectedTrashPosts}
          onEmptyTrash={onRequestEmptyTrash}
        />
      )}

      <div className="space-y-4">
        {isTrashView
          ? trashPosts.map((post) => (
              <TrashPostCard
                key={post.id}
                post={post}
                checked={selectedTrashPostIds.has(post.id)}
                onCheckedChange={(checked) => onToggleTrashPostSelection(post.id, checked)}
              />
            ))
          : posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleFavorite={onToggleFavorite}
                onEdit={onEdit}
                isMemoEditing={post.mode === "memo" && editingMemoPostId === post.id}
                memoEditValue={post.mode === "memo" && editingMemoPostId === post.id ? editingMemoValue : ""}
                onMemoEditValueChange={onMemoEditValueChange}
                onCancelMemoEdit={onCancelMemoEdit}
                onSaveMemoEditStub={(value) => onSaveMemoEditStub(post.id, value)}
              />
            ))}
      </div>

      <LoadingStates showEmpty={isTrashView ? trashPosts.length === 0 : posts.length === 0} showSkeleton />
    </section>
  );
}
