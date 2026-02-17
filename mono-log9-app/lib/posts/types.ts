export type PostMode = "memo" | "note";
export type PostView = PostMode | "trash";

export type PostRecord = {
  id: string;
  mode: PostMode;
  title?: string;
  content: string;
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
  content: string;
};

export type UpdatePostInput = {
  postId: string;
  title?: string;
  content: string;
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
  createPost: (input: CreatePostInput) => Promise<PostRecord>;
  updatePost: (input: UpdatePostInput) => Promise<PostRecord>;
  setFavorite: (input: SetFavoriteInput) => Promise<PostRecord>;
  moveToTrash: (input: MoveToTrashInput) => Promise<void>;
  restoreFromTrash: (input: RestoreFromTrashInput) => Promise<void>;
};
