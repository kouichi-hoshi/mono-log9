import { PostRepositoryError } from "@/lib/posts/errors";
import type { PostRepository } from "@/lib/posts/types";

const notImplemented = () => {
  throw new PostRepositoryError("NOT_IMPLEMENTED", "現在この環境では投稿機能を利用できません。");
};

export const unimplementedPostRepository: PostRepository = {
  listPosts: async () => notImplemented(),
  createPost: async () => notImplemented(),
  updatePost: async () => notImplemented(),
  setFavorite: async () => notImplemented(),
  moveToTrash: async () => notImplemented(),
  restoreFromTrash: async () => notImplemented(),
};
