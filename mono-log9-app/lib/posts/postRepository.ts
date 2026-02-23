import { getStubPostsEnabled } from "@/lib/env";
import { createDbPostRepository } from "@/lib/posts/repositories/dbPostRepository";
import { stubPostRepository } from "@/lib/posts/repositories/stubPostRepository";
import { unimplementedPostRepository } from "@/lib/posts/repositories/unimplementedPostRepository";
import type { PostRepository } from "@/lib/posts/types";

function resolvePostRepository(): PostRepository {
  if (getStubPostsEnabled()) {
    return stubPostRepository;
  }

  return unimplementedPostRepository;
}

export function getActorPostRepository(actorUserId: string): PostRepository {
  if (getStubPostsEnabled()) {
    return stubPostRepository;
  }

  return createDbPostRepository({ actorUserId });
}

export const postRepository: PostRepository = {
  async listPosts(input) {
    return resolvePostRepository().listPosts(input);
  },
  async createPost(input) {
    return resolvePostRepository().createPost(input);
  },
  async updatePost(input) {
    return resolvePostRepository().updatePost(input);
  },
  async setFavorite(input) {
    return resolvePostRepository().setFavorite(input);
  },
  async moveToTrash(input) {
    return resolvePostRepository().moveToTrash(input);
  },
  async restoreFromTrash(input) {
    return resolvePostRepository().restoreFromTrash(input);
  },
  async deleteTrashPosts(input) {
    return resolvePostRepository().deleteTrashPosts(input);
  },
  async emptyTrash() {
    return resolvePostRepository().emptyTrash();
  },
};
