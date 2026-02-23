import {
  assertContentTextByMode,
  assertValidPostContent,
  extractContentText,
  normalizePostTitle,
} from "@/lib/posts/content";
import { PostRepositoryError } from "@/lib/posts/errors";
import type {
  CreatePostInput,
  ListPostsInput,
  UpdatePostInput,
  ValidatedCreatePostDto,
  ValidatedUpdatePostDto,
} from "@/lib/posts/types";

const INVALID_INPUT_MESSAGE = "入力内容に不備があります";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_VIEWS = new Set(["memo", "note", "trash"]);

export const DEFAULT_LIST_LIMIT = 10;
export const MAX_LIST_LIMIT = 50;

export type PostIdValidationMode = "stub" | "db";

function throwValidationError(message = INVALID_INPUT_MESSAGE): never {
  throw new PostRepositoryError("VALIDATION_ERROR", message);
}

function normalizeTitleWithoutMode(title: unknown): string | undefined {
  if (typeof title === "undefined") {
    return undefined;
  }

  if (typeof title !== "string") {
    throwValidationError();
  }

  const normalized = title.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  if (normalized.length > 100) {
    throwValidationError();
  }

  return normalized;
}

export function validatePostIdFormat(postId: unknown): string {
  return validatePostIdFormatByMode(postId, "stub");
}

export function validatePostIdFormatByMode(
  postId: unknown,
  mode: PostIdValidationMode
): string {
  if (typeof postId !== "string") {
    throwValidationError();
  }

  if (mode !== "db" && mode !== "stub") {
    throwValidationError();
  }
  if (!UUID_PATTERN.test(postId)) {
    throwValidationError();
  }

  return postId;
}

export function toValidatedCreatePostDto(input: CreatePostInput): ValidatedCreatePostDto {
  if (input.mode !== "memo" && input.mode !== "note") {
    throwValidationError();
  }

  assertValidPostContent(input.content);
  const title = normalizePostTitle(input.title, input.mode);
  const contentText = extractContentText(input.content, input.mode);
  assertContentTextByMode(contentText, input.mode);

  return {
    mode: input.mode,
    title,
    content: input.content,
    contentText,
  };
}

type ValidateUpdatePostOptions = {
  postIdMode?: PostIdValidationMode;
};

export function toValidatedUpdatePostDto(
  input: UpdatePostInput,
  options: ValidateUpdatePostOptions = {}
): ValidatedUpdatePostDto {
  const postId = validatePostIdFormatByMode(input.postId, options.postIdMode ?? "stub");
  assertValidPostContent(input.content);
  const title = normalizeTitleWithoutMode(input.title);

  return {
    postId,
    title,
    content: input.content,
  };
}

export function normalizeListLimit(limit: number | undefined): number {
  if (typeof limit === "undefined") {
    return DEFAULT_LIST_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    throwValidationError();
  }

  return limit;
}

export function toValidatedListPostsInput(input: ListPostsInput): ListPostsInput {
  if (!VALID_VIEWS.has(input.view)) {
    throwValidationError();
  }

  if (typeof input.favoriteOnly !== "boolean") {
    throwValidationError();
  }

  if (typeof input.limit !== "undefined") {
    normalizeListLimit(input.limit);
  }

  if (typeof input.cursor !== "undefined" && typeof input.cursor !== "string") {
    throwValidationError();
  }

  return {
    view: input.view,
    favoriteOnly: input.favoriteOnly,
    limit: input.limit,
    cursor: input.cursor,
  };
}
