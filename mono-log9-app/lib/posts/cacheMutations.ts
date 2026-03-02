import {
  normalizePostsListCondition,
  type PostsListCondition,
} from "@/lib/posts/queryKeys";
import {
  comparePostsByCreatedAtDesc,
  comparePostsByTrashedAtDesc,
} from "@/lib/posts/sort";
import type { PostRecord } from "@/lib/posts/types";

export type CacheMutationContext = {
  condition: PostsListCondition;
  items: PostRecord[];
};

function normalizeCondition(condition: PostsListCondition): PostsListCondition {
  return normalizePostsListCondition(condition);
}

function removeById(items: PostRecord[], postId: string): PostRecord[] {
  return items.filter((item) => item.id !== postId);
}

function sortItemsForCondition(items: PostRecord[], condition: PostsListCondition): PostRecord[] {
  if (condition.view === "trash") {
    return [...items].sort(comparePostsByTrashedAtDesc);
  }

  return [...items].sort(comparePostsByCreatedAtDesc);
}

export function upsertForCurrentView(
  context: CacheMutationContext,
  updated: PostRecord
): PostRecord[] {
  const condition = normalizeCondition(context.condition);
  const withoutTarget = removeById(context.items, updated.id);

  if (condition.view === "trash") {
    if (typeof updated.trashedAt === "undefined") {
      return withoutTarget;
    }

    return sortItemsForCondition([updated, ...withoutTarget], condition);
  }

  const isVisibleModePost = updated.mode === condition.view && typeof updated.trashedAt === "undefined";
  const canDisplay = isVisibleModePost && (!condition.favoriteOnly || updated.favorite);

  if (!canDisplay) {
    return withoutTarget;
  }

  return sortItemsForCondition([updated, ...withoutTarget], condition);
}

export function applyFavoriteMutation(
  context: CacheMutationContext,
  updated: PostRecord
): PostRecord[] {
  return upsertForCurrentView(context, updated);
}

export function applyMoveToTrashMutation(
  context: CacheMutationContext,
  input: { postId: string; movedPost: PostRecord | null }
): PostRecord[] {
  const condition = normalizeCondition(context.condition);

  if (condition.view !== "trash") {
    return removeById(context.items, input.postId);
  }

  if (!input.movedPost) {
    return context.items;
  }

  return sortItemsForCondition(
    [input.movedPost, ...removeById(context.items, input.postId)],
    condition
  );
}

export function applyRestoreFromTrashMutation(
  context: CacheMutationContext,
  input: { postId: string; restoredPost: PostRecord | null }
): PostRecord[] {
  const condition = normalizeCondition(context.condition);
  const withoutTarget = removeById(context.items, input.postId);

  if (condition.view === "trash") {
    return withoutTarget;
  }

  if (!input.restoredPost || input.restoredPost.mode !== condition.view) {
    return withoutTarget;
  }

  const shouldShow = !condition.favoriteOnly || input.restoredPost.favorite;
  if (!shouldShow) {
    return withoutTarget;
  }

  return sortItemsForCondition([input.restoredPost, ...withoutTarget], condition);
}

export function applyDeletePostsMutation(
  context: CacheMutationContext,
  deletedPostIds: string[]
): PostRecord[] {
  if (deletedPostIds.length === 0) {
    return context.items;
  }

  const removed = new Set(deletedPostIds);
  return context.items.filter((post) => !removed.has(post.id));
}
