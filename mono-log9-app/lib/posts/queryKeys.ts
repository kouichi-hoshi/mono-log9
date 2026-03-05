import type { PostView } from "@/lib/posts/types";

export type PostsListCondition = {
  view: PostView;
  favoriteOnly: boolean;
  actorScope: string;
};

export function normalizePostsListCondition(input: PostsListCondition): PostsListCondition {
  const actorScope = input.actorScope.trim() || "anonymous";
  if (input.view === "trash") {
    return { view: "trash", favoriteOnly: false, actorScope };
  }

  return {
    ...input,
    actorScope,
  };
}

export function postsListQueryKey(input: PostsListCondition) {
  const condition = normalizePostsListCondition(input);
  return ["posts", condition] as const;
}
