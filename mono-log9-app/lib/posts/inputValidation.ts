import {
  assertContentTextByMode,
  assertValidPostContent,
  extractContentText,
  normalizePostTitle,
} from "@/lib/posts/content";
import { PostRepositoryError } from "@/lib/posts/errors";
import type {
  CreatePostInput,
  UpdatePostInput,
  ValidatedCreatePostDto,
  ValidatedUpdatePostDto,
} from "@/lib/posts/types";

const INVALID_INPUT_MESSAGE = "入力内容に不備があります";
const POST_ID_PATTERN = /^(post|trash)-\d+$/;

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
  if (typeof postId !== "string" || !POST_ID_PATTERN.test(postId)) {
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

export function toValidatedUpdatePostDto(input: UpdatePostInput): ValidatedUpdatePostDto {
  const postId = validatePostIdFormat(input.postId);
  assertValidPostContent(input.content);
  const title = normalizeTitleWithoutMode(input.title);

  return {
    postId,
    title,
    content: input.content,
  };
}
