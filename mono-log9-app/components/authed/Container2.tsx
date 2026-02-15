"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import { Button } from "@/components/ui/button";
import type { StubPost, ViewMode } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { toast } from "sonner";

type Container2Props = {
  mode: ViewMode;
  favoriteOnly: boolean;
  posts: StubPost[];
  onFavoriteToggle: () => void;
  onToggleFavorite: (postId: string) => void;
  onEdit: (postId: string) => void;
  editingMemoPostId: string | null;
  editingMemoValue: string;
  onMemoEditValueChange: (nextValue: string) => void;
  onCancelMemoEdit: () => void;
  onSaveMemoEditStub: (postId: string, value: string) => void;
};

export default function Container2({
  mode,
  favoriteOnly,
  posts,
  onFavoriteToggle,
  onToggleFavorite,
  onEdit,
  editingMemoPostId,
  editingMemoValue,
  onMemoEditValueChange,
  onCancelMemoEdit,
  onSaveMemoEditStub,
}: Container2Props) {
  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    toast("未実装です");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">
          {mode === "memo" ? "メモ" : "ノート"}
        </h2>
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
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
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

      <LoadingStates showEmpty={posts.length === 0} showSkeleton />
    </section>
  );
}
