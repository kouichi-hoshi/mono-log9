import {
  assertContentTextByMode,
  assertValidPostContent,
  clonePostContent,
  extractContentText,
  normalizePostTitle,
} from "@/lib/posts/content";
import { encodePostsCursor, parseCursorInput } from "@/lib/posts/cursor";
import { formatJstDateTime, parseDisplayJstDateTime } from "@/lib/posts/dateTime";
import { PostRepositoryError } from "@/lib/posts/errors";
import { normalizeListLimit, validatePostIdFormatByMode } from "@/lib/posts/inputValidation";
import { comparePostsByCreatedAtDesc, comparePostsByTrashedAtDesc } from "@/lib/posts/sort";
import { cloneInitialStubPosts } from "@/lib/posts/stubSeed";
import { randomUUID } from "node:crypto";
import type {
  DeleteTrashPostsInput,
  DeleteTrashPostsResult,
  EmptyTrashResult,
  ListPostsInput,
  ListPostsResult,
  MoveToTrashInput,
  PostRecord,
  PostRepository,
  RestoreFromTrashInput,
  SetFavoriteInput,
  ValidatedCreatePostDto,
  ValidatedUpdatePostDto,
} from "@/lib/posts/types";

let posts: PostRecord[] = cloneInitialStubPosts().map(withSortKeys);

function ensureDevelopmentOnly() {
  if (process.env.NODE_ENV !== "development") {
    throw new PostRepositoryError("FORBIDDEN", "スタブ投稿データは利用できません");
  }
}

function withSortKeys(post: PostRecord): PostRecord {
  const created = parseDisplayJstDateTime(post.createdAt);
  const trashed =
    typeof post.trashedAt === "string" ? parseDisplayJstDateTime(post.trashedAt) : null;

  return {
    ...post,
    createdAtEpochMs: created?.getTime(),
    trashedAtEpochMs: trashed?.getTime(),
  };
}

function clonePost(post: PostRecord): PostRecord {
  return withSortKeys({ ...post, content: clonePostContent(post.content) });
}

function formatNowDate(): string {
  return formatJstDateTime(new Date());
}

function validatePostId(postId: string) {
  try {
    validatePostIdFormatByMode(postId, "stub");
  } catch {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function validateMode(mode: unknown) {
  if (mode !== "memo" && mode !== "note") {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function validateBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
  }
}

function normalizeDeletePostIds(postIds: string[]): string[] {
  const uniqueIds = new Set<string>();
  for (const postId of postIds) {
    validatePostId(postId);
    uniqueIds.add(postId);
  }

  return Array.from(uniqueIds);
}

function toIsoFromDisplayDate(value: string): string {
  const parsed = parseDisplayJstDateTime(value);
  if (!parsed) {
    throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
  }
  return parsed.toISOString();
}

function getSortDateText(post: PostRecord, view: ListPostsInput["view"]): string {
  if (view === "trash") {
    if (typeof post.trashedAt !== "string") {
      throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
    }
    return post.trashedAt;
  }
  return post.createdAt;
}

function filterPostsForList(input: ListPostsInput): PostRecord[] {
  if (input.view === "trash") {
    return posts
      .filter((post) => typeof post.trashedAt !== "undefined")
      .sort(comparePostsByTrashedAtDesc);
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
    .sort(comparePostsByCreatedAtDesc);
}

function resolveCursorStartIndex(
  items: PostRecord[],
  cursor: string | undefined,
  view: ListPostsInput["view"]
): number {
  const parsedCursor = parseCursorInput(cursor);
  if (parsedCursor.kind === "none") {
    return 0;
  }

  const index = items.findIndex((post) => post.id === parsedCursor.id);
  if (index === -1) {
    throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
  }

  const anchor = items[index];
  const anchorIso = toIsoFromDisplayDate(getSortDateText(anchor, view));
  if (parsedCursor.t !== anchorIso) {
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

export const stubPostRepository: PostRepository = {
  async listPosts(input: ListPostsInput): Promise<ListPostsResult> {
    ensureDevelopmentOnly();

    const limit = normalizeListLimit(input.limit);
    const filtered = filterPostsForList(input);
    const startIndex = resolveCursorStartIndex(filtered, input.cursor, input.view);
    const items = filtered.slice(startIndex, startIndex + limit).map(clonePost);
    const hasNext = startIndex + limit < filtered.length;
    const last = items[items.length - 1];

    return {
      items,
      hasNext,
      nextCursor:
        hasNext && last
          ? encodePostsCursor({
              v: 1,
              t: toIsoFromDisplayDate(getSortDateText(last, input.view)),
              id: last.id,
            })
          : null,
    };
  },

  async createPost(input: ValidatedCreatePostDto): Promise<PostRecord> {
    ensureDevelopmentOnly();

    validateMode(input.mode);
    assertValidPostContent(input.content);
    const derivedContentText = extractContentText(input.content, input.mode);
    if (derivedContentText !== input.contentText) {
      throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
    }
    assertContentTextByMode(input.contentText, input.mode);
    const normalizedTitle = normalizePostTitle(input.title, input.mode);

    const created: PostRecord = {
      id: randomUUID(),
      mode: input.mode,
      title: normalizedTitle,
      content: clonePostContent(input.content),
      contentText: input.contentText,
      favorite: false,
      createdAt: formatNowDate(),
    };

    posts = [withSortKeys(created), ...posts];
    return clonePost(created);
  },

  async updatePost(input: ValidatedUpdatePostDto): Promise<PostRecord> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);
    assertValidPostContent(input.content);

    const target = findPost(input.postId);
    const normalizedTitle = normalizePostTitle(input.title, target.mode);
    const contentText = extractContentText(input.content, target.mode);
    assertContentTextByMode(contentText, target.mode);

    if (
      target.title === normalizedTitle &&
      JSON.stringify(target.content) === JSON.stringify(input.content)
    ) {
      return clonePost(target);
    }

    target.title = normalizedTitle;
    target.content = clonePostContent(input.content);
    target.contentText = contentText;

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
    target.trashedAtEpochMs = parseDisplayJstDateTime(target.trashedAt)?.getTime();
  },

  async restoreFromTrash(input: RestoreFromTrashInput): Promise<void> {
    ensureDevelopmentOnly();

    validatePostId(input.postId);

    const target = findPost(input.postId);
    if (typeof target.trashedAt === "undefined") {
      return;
    }

    target.trashedAt = undefined;
    target.trashedAtEpochMs = undefined;
  },

  async deleteTrashPosts(input: DeleteTrashPostsInput): Promise<DeleteTrashPostsResult> {
    ensureDevelopmentOnly();

    if (!Array.isArray(input.postIds)) {
      throw new PostRepositoryError("VALIDATION_ERROR", "入力内容に不備があります");
    }

    const normalizedPostIds = normalizeDeletePostIds(input.postIds);
    if (normalizedPostIds.length === 0) {
      return { deletedPostIds: [] };
    }

    for (const postId of normalizedPostIds) {
      const target = findPost(postId);
      if (typeof target.trashedAt === "undefined") {
        throw new PostRepositoryError("NOT_FOUND", "対象が見つかりません");
      }
    }

    const deleteSet = new Set(normalizedPostIds);
    posts = posts.filter((post) => !deleteSet.has(post.id));

    return { deletedPostIds: normalizedPostIds };
  },

  async emptyTrash(): Promise<EmptyTrashResult> {
    ensureDevelopmentOnly();

    const beforeCount = posts.length;
    posts = posts.filter((post) => typeof post.trashedAt === "undefined");
    const deletedCount = beforeCount - posts.length;

    return { deletedCount };
  },
};

export function __resetStubPostRepositoryForTests() {
  posts = cloneInitialStubPosts().map(withSortKeys);
}
