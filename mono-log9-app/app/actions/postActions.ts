"use server";

import { isPostRepositoryError, type PostErrorCode } from "@/lib/posts/errors";
import {
  toValidatedCreatePostDto,
  toValidatedUpdatePostDto,
} from "@/lib/posts/inputValidation";
import { postRepository } from "@/lib/posts/postRepository";
import type {
  CreatePostInput,
  ListPostsInput,
  ListPostsResult,
  MoveToTrashInput,
  PostRecord,
  RestoreFromTrashInput,
  SetFavoriteInput,
  UpdatePostInput,
} from "@/lib/posts/types";

type ActionError = {
  code: PostErrorCode;
  message: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

function toErrorResult(error: unknown): ActionResult<never> {
  if (isPostRepositoryError(error)) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  throw error;
}

export async function listPostsAction(input: ListPostsInput): Promise<ActionResult<ListPostsResult>> {
  try {
    const data = await postRepository.listPosts(input);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function createPostAction(input: CreatePostInput): Promise<ActionResult<PostRecord>> {
  try {
    const validated = toValidatedCreatePostDto(input);
    const data = await postRepository.createPost(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updatePostAction(input: UpdatePostInput): Promise<ActionResult<PostRecord>> {
  try {
    const validated = toValidatedUpdatePostDto(input);
    const data = await postRepository.updatePost(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function setFavoriteAction(input: SetFavoriteInput): Promise<ActionResult<PostRecord>> {
  try {
    const data = await postRepository.setFavorite(input);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function moveToTrashAction(input: MoveToTrashInput): Promise<ActionResult<null>> {
  try {
    await postRepository.moveToTrash(input);
    return { ok: true, data: null };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function restoreFromTrashAction(
  input: RestoreFromTrashInput
): Promise<ActionResult<null>> {
  try {
    await postRepository.restoreFromTrash(input);
    return { ok: true, data: null };
  } catch (error) {
    return toErrorResult(error);
  }
}
