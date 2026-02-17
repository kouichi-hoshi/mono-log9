import { PostRepositoryError } from "@/lib/posts/errors";
import { cloneInitialStubPosts } from "@/lib/posts/stubSeed";
import type {
  CreatePostInput,
  ListPostsInput,
  ListPostsResult,
  MoveToTrashInput,
  PostMode,
  PostRecord,
  PostRepository,
  RestoreFromTrashInput,
  SetFavoriteInput,
  UpdatePostInput,
} from "@/lib/posts/types";

const DEFAULT_LIMIT = 10;

let posts: PostRecord[] = cloneInitialStubPosts();

function ensureDevelopmentOnly() {
  if (process.env.NODE_ENV !== "development") {
    throw new PostRepositoryError("FORBIDDEN", "スタブ投稿データは利用できません");
  }
}

function clonePost(post: PostRecord): PostRecord {
  return { ...post };
}

function formatNowDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function isValidPostId(postId: string): boolean {
  return /^(post|trash)-\d+$/.test(postId);
}

function validatePostId(postId: string) {
  if (!isValidPostId(postId)) {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function validateMode(mode: PostMode) {
  if (mode !== "memo" && mode !== "note") {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function validateBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function validateContentByMode(mode: PostMode, content: string) {
  if (content.trim().length === 0) {
    throw new PostRepositoryError("VALIDATION_ERROR", "内容を入力してください");
  }

  if (mode === "memo" && content.length > 280) {
    throw new PostRepositoryError("VALIDATION_ERROR", "内容は最大280文字までです");
  }

  if (mode === "note" && content.length > 25000) {
    throw new PostRepositoryError("VALIDATION_ERROR", "内容は最大25000文字までです");
  }
}

function normalizeLimit(limit: number | undefined): number {
  if (typeof limit === "undefined") {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }

  return limit;
}

function sortByCreatedAtDesc(a: PostRecord, b: PostRecord): number {
  if (a.createdAt === b.createdAt) {
    return b.id.localeCompare(a.id);
  }

  return b.createdAt.localeCompare(a.createdAt);
}

function sortByTrashedAtDesc(a: PostRecord, b: PostRecord): number {
  const aTrashedAt = a.trashedAt ?? "";
  const bTrashedAt = b.trashedAt ?? "";

  if (aTrashedAt === bTrashedAt) {
    return b.id.localeCompare(a.id);
  }

  return bTrashedAt.localeCompare(aTrashedAt);
}

function filterPostsForList(input: ListPostsInput): PostRecord[] {
  if (input.view === "trash") {
    return posts.filter((post) => typeof post.trashedAt !== "undefined").sort(sortByTrashedAtDesc);
  }

  return posts
    .filter((post) => {
      if (typeof post.trashedAt !== "undefined") {
        return false;
      }

      if (post.mode !== input.view) {
        return false;
      }

      if (input.favoriteOnly && !post.favorite) {
        return false;
      }

      return true;
    })
    .sort(sortByCreatedAtDesc);
}

function resolveCursorStartIndex(items: PostRecord[], cursor: string | undefined): number {
  if (typeof cursor === "undefined") {
    return 0;
  }

  if (cursor.trim().length === 0) {
    throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
  }

  const index = items.findIndex((post) => post.id === cursor);
  if (index === -1) {
    throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
  }

  return index + 1;
}

function findPost(postId: string): PostRecord {
  const post = posts.find((current) => current.id === postId);
  if (!post) {
    throw new PostRepositoryError("NOT_FOUND", "対象が見つかりません");
  }

  return post;
}

function buildNextPostId(): string {
  const max = posts.reduce((currentMax, post) => {
    const match = /^post-(\d+)$/.exec(post.id);
    if (!match) {
      return currentMax;
    }

    const value = Number.parseInt(match[1], 10);
    return Number.isNaN(value) ? currentMax : Math.max(currentMax, value);
  }, 0);

  return `post-${`${max + 1}`.padStart(3, "0")}`;
}

export const stubPostRepository: PostRepository = {
  async listPosts(input: ListPostsInput): Promise<ListPostsResult> {
    ensureDevelopmentOnly();

    const limit = normalizeLimit(input.limit);
    const filtered = filterPostsForList(input);
    const startIndex = resolveCursorStartIndex(filtered, input.cursor);
    const items = filtered.slice(startIndex, startIndex + limit).map(clonePost);
    const hasNext = startIndex + limit < filtered.length;

    return {
      items,
      hasNext,
      nextCursor: hasNext && items.length > 0 ? items[items.length - 1].id : null,
    };
  },

  async createPost(input: CreatePostInput): Promise<PostRecord> {
    ensureDevelopmentOnly();

    validateMode(input.mode);
    validateContentByMode(input.mode, input.content);

    const created: PostRecord = {
      id: buildNextPostId(),
      mode: input.mode,
      title: input.title,
      content: input.content,
      favorite: false,
      createdAt: formatNowDate(),
    };

    posts = [created, ...posts];
    return clonePost(created);
  },

  async updatePost(input: UpdatePostInput): Promise<PostRecord> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);
    if (input.content.trim().length === 0 || input.content.length > 25000) {
      throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
    }

    const target = findPost(input.postId);
    validateContentByMode(target.mode, input.content);

    if (target.title === input.title && target.content === input.content) {
      return clonePost(target);
    }

    target.title = input.title;
    target.content = input.content;

    return clonePost(target);
  },

  async setFavorite(input: SetFavoriteInput): Promise<PostRecord> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);
    validateBoolean(input.favorite);

    const target = findPost(input.postId);
    if (target.favorite === input.favorite) {
      return clonePost(target);
    }

    target.favorite = input.favorite;
    return clonePost(target);
  },

  async moveToTrash(input: MoveToTrashInput): Promise<void> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);

    const target = findPost(input.postId);
    if (typeof target.trashedAt !== "undefined") {
      return;
    }

    target.trashedAt = formatNowDate();
  },

  async restoreFromTrash(input: RestoreFromTrashInput): Promise<void> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);

    const target = findPost(input.postId);
    if (typeof target.trashedAt === "undefined") {
      return;
    }

    target.trashedAt = undefined;
  },
};

export function __resetStubPostRepositoryForTests() {
  posts = cloneInitialStubPosts();
}
