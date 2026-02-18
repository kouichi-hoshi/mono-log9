import type { PostView } from "@/lib/posts/types";

export type PostsListCondition = {
  view: PostView;
  favoriteOnly: boolean;
};

export function normalizePostsListCondition(input: PostsListCondition): PostsListCondition {
  if (input.view === "trash") {
    return { view: "trash", favoriteOnly: false };
  }

  return input;
}

export function postsListQueryKey(input: PostsListCondition) {
  const condition = normalizePostsListCondition(input);
  return ["posts", condition] as const;
}
