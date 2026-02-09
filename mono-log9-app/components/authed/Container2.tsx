"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import type { PostMode, StubPost } from "@/components/authed/stubs";

type Container2Props = {
  mode: PostMode;
  posts: StubPost[];
  onToggleFavorite: (postId: string) => void;
};

export default function Container2({ mode, posts, onToggleFavorite }: Container2Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/60">投稿一覧</p>
          <h2 className="text-lg font-semibold">
            {mode === "memo" ? "メモ" : "ノート"}
          </h2>
        </div>
        <span className="text-xs text-foreground/60">{posts.length}件</span>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>

      <LoadingStates showEmpty={posts.length === 0} showSkeleton />
    </section>
  );
}
