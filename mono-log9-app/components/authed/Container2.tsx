import LoadingStates from "@/components/authed/LoadingStates";
import PostCard from "@/components/authed/PostCard";
import TagCloud from "@/components/authed/TagCloud";
import type { StubPost, StubTag } from "@/components/authed/stubs";

type Container2Props = {
  posts: StubPost[];
  tags: StubTag[];
};

export default function Container2({ posts, tags }: Container2Props) {
  return (
    <section className="space-y-6">
      <TagCloud tags={tags} />
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <LoadingStates />
    </section>
  );
}
