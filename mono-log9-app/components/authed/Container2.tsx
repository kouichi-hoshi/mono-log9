"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import type { StubPost, ViewMode } from "@/components/authed/stubs";

type Container2Props = {
  mode: ViewMode;
  posts: StubPost[];
  onToggleFavorite: (postId: string) => void;
};

export default function Container2({ mode, posts, onToggleFavorite }: Container2Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === "all" ? "全て" : mode === "memo" ? "メモ" : "ノート"}
      </h2>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>

      <LoadingStates showEmpty={posts.length === 0} showSkeleton />
    </section>
  );
}
