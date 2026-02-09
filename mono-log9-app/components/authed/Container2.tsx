"use client";

import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import type { Post } from "@/components/authed/stubs";

type Container2Props = {
  posts: Post[];
};

export default function Container2({ posts }: Container2Props) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold">投稿一覧</p>
        <p className="text-xs text-foreground/60">
          スタブデータを表示しています。
        </p>
      </div>
      {posts.length === 0 ? (
        <LoadingStates />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
