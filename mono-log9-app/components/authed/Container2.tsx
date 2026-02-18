"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import TrashBulkActions from "@/components/authed/TrashBulkActions";
import TrashPostCard from "@/components/authed/TrashPostCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/components/authed/stubs";
import type { PostRecord } from "@/lib/posts/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

type Container2Props = {
  mode: ViewMode;
  isTrashView: boolean;
  favoriteOnly: boolean;
  posts: PostRecord[];
  trashPosts: PostRecord[];
  isInitialLoading: boolean;
  isNextPageLoading: boolean;
  hasNextPage: boolean;
  initialErrorMessage: string | null;
  nextPageErrorMessage: string | null;
  onRetryInitialLoad: () => void;
  onRetryNextPageLoad: () => void;
  loadMoreSentinelRef: (element: HTMLDivElement | null) => void;
  onFavoriteToggle: () => void;
  onToggleFavorite: (postId: string) => void;
  onMoveToTrash: (postId: string) => void;
  onEdit: (postId: string) => void;
  editingMemoPostId: string | null;
  editingMemoValue: string;
  onMemoEditValueChange: (nextValue: string) => void;
  onCancelMemoEdit: () => void;
  onSaveMemoEditStub: (postId: string, value: string) => Promise<boolean> | boolean;
  selectedTrashPostIds: Set<string>;
  onToggleTrashPostSelection: (postId: string, checked: boolean) => void;
  onSelectAllVisibleTrashPosts: () => void;
  onClearTrashPostSelection: () => void;
  onRequestDeleteSelectedTrashPosts: () => void;
  onRequestEmptyTrash: () => void;
  onRestoreTrashPostStub: (postId: string) => void;
  onPermanentDeleteTrashPostStub: (postId: string) => void;
};

export default function Container2({
  mode,
  isTrashView,
  favoriteOnly,
  posts,
  trashPosts,
  isInitialLoading,
  isNextPageLoading,
  hasNextPage,
  initialErrorMessage,
  nextPageErrorMessage,
  onRetryInitialLoad,
  onRetryNextPageLoad,
  loadMoreSentinelRef,
  onFavoriteToggle,
  onToggleFavorite,
  onMoveToTrash,
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
  onRestoreTrashPostStub,
  onPermanentDeleteTrashPostStub,
}: Container2Props) {
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
            onClick={onFavoriteToggle}
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
                onRestore={onRestoreTrashPostStub}
                onPermanentDelete={onPermanentDeleteTrashPostStub}
              />
            ))
          : posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleFavorite={onToggleFavorite}
                onMoveToTrash={onMoveToTrash}
                onEdit={onEdit}
                isMemoEditing={post.mode === "memo" && editingMemoPostId === post.id}
                memoEditValue={post.mode === "memo" && editingMemoPostId === post.id ? editingMemoValue : ""}
                onMemoEditValueChange={onMemoEditValueChange}
                onCancelMemoEdit={onCancelMemoEdit}
                onSaveMemoEditStub={(value) => onSaveMemoEditStub(post.id, value)}
              />
            ))}
      </div>

      {initialErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{initialErrorMessage}</AlertDescription>
        </Alert>
      )}
      {initialErrorMessage && (
        <Button type="button" variant="outline" size="sm" onClick={onRetryInitialLoad}>
          再試行
        </Button>
      )}
      {nextPageErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{nextPageErrorMessage}</AlertDescription>
        </Alert>
      )}
      {nextPageErrorMessage && (
        <Button type="button" variant="outline" size="sm" onClick={onRetryNextPageLoad}>
          追加取得を再試行
        </Button>
      )}

      <LoadingStates
        showEmpty={
          !initialErrorMessage &&
          !isInitialLoading &&
          !isNextPageLoading &&
          (isTrashView ? trashPosts.length === 0 : posts.length === 0)
        }
        showInitialSkeleton={isInitialLoading}
        showNextPageSkeleton={isNextPageLoading}
      />
      {hasNextPage && <div ref={loadMoreSentinelRef} aria-hidden="true" data-testid="posts-load-more-sentinel" />}
    </section>
  );
}
