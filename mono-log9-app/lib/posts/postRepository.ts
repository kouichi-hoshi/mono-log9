import { getStubPostsEnabled } from "@/lib/env";
import { stubPostRepository } from "@/lib/posts/repositories/stubPostRepository";
import { unimplementedPostRepository } from "@/lib/posts/repositories/unimplementedPostRepository";
import type { PostRepository } from "@/lib/posts/types";

function resolvePostRepository(): PostRepository {
  if (getStubPostsEnabled()) {
    return stubPostRepository;
  }

  return unimplementedPostRepository;
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
};
