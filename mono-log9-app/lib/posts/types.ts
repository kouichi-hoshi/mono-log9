import type { JSONContent } from "@tiptap/core";

export type PostMode = "memo" | "note";
export type PostView = PostMode | "trash";
export type PostContent = JSONContent;

export type PostRecord = {
  id: string;
  mode: PostMode;
  title?: string;
  content: PostContent;
  contentText: string;
  favorite: boolean;
  createdAt: string;
  trashedAt?: string;
};

export type ListPostsInput = {
  view: PostView;
  favoriteOnly: boolean;
  limit?: number;
  cursor?: string;
};

export type ListPostsResult = {
  items: PostRecord[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type CreatePostInput = {
  mode: PostMode;
  title?: string;
  content: PostContent;
};

export type UpdatePostInput = {
  postId: string;
  title?: string;
  content: PostContent;
};

export type ValidatedCreatePostDto = {
  mode: PostMode;
  title?: string;
  content: PostContent;
  contentText: string;
};

export type ValidatedUpdatePostDto = {
  postId: string;
  title?: string;
  content: PostContent;
};

export type SetFavoriteInput = {
  postId: string;
  favorite: boolean;
};

export type MoveToTrashInput = {
  postId: string;
};

export type RestoreFromTrashInput = {
  postId: string;
};

export type PostRepository = {
  listPosts: (input: ListPostsInput) => Promise<ListPostsResult>;
  createPost: (input: ValidatedCreatePostDto) => Promise<PostRecord>;
  updatePost: (input: ValidatedUpdatePostDto) => Promise<PostRecord>;
  setFavorite: (input: SetFavoriteInput) => Promise<PostRecord>;
  moveToTrash: (input: MoveToTrashInput) => Promise<void>;
  restoreFromTrash: (input: RestoreFromTrashInput) => Promise<void>;
};
