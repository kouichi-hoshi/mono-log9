"use server";

import { ensureActorUserFromSession } from "@/lib/auth/actorUser";
import { getStubPostsEnabled } from "@/lib/env";
import { isPostRepositoryError, type PostErrorCode } from "@/lib/posts/errors";
import {
  toValidatedListPostsInput,
  toValidatedCreatePostDto,
  toValidatedUpdatePostDto,
} from "@/lib/posts/inputValidation";
import { getActorPostRepository, postRepository } from "@/lib/posts/postRepository";
import type {
  CreatePostInput,
  DeleteTrashPostsInput,
  DeleteTrashPostsResult,
  EmptyTrashResult,
  ListPostsInput,
  ListPostsResult,
  MoveToTrashInput,
  PostRecord,
  RestoreFromTrashInput,
  SetFavoriteInput,
  UpdatePostInput,
  PostRepository,
} from "@/lib/posts/types";

export type ActionError = {
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

  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "エラーが発生しました",
    },
  };
}

async function resolveRepositoryForAction(): Promise<PostRepository> {
  if (getStubPostsEnabled()) {
    return postRepository;
  }

  const { auth } = await import("@/auth");
  const session = await auth();
  const actorUserId = await ensureActorUserFromSession(session);
  return getActorPostRepository(actorUserId);
}

export async function listPostsAction(input: ListPostsInput): Promise<ActionResult<ListPostsResult>> {
  try {
    const repository = await resolveRepositoryForAction();
    const validated = toValidatedListPostsInput(input);
    const data = await repository.listPosts(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function createPostAction(input: CreatePostInput): Promise<ActionResult<PostRecord>> {
  try {
    const repository = await resolveRepositoryForAction();
    const validated = toValidatedCreatePostDto(input);
    const data = await repository.createPost(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function updatePostAction(input: UpdatePostInput): Promise<ActionResult<PostRecord>> {
  try {
    const stubPostsEnabled = getStubPostsEnabled();
    const repository = await resolveRepositoryForAction();
    const validated = toValidatedUpdatePostDto(input, {
      postIdMode: stubPostsEnabled ? "stub" : "db",
    });
    const data = await repository.updatePost(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function setFavoriteAction(input: SetFavoriteInput): Promise<ActionResult<PostRecord>> {
  try {
    const repository = await resolveRepositoryForAction();
    const data = await repository.setFavorite(input);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function moveToTrashAction(input: MoveToTrashInput): Promise<ActionResult<null>> {
  try {
    const repository = await resolveRepositoryForAction();
    await repository.moveToTrash(input);
    return { ok: true, data: null };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function restoreFromTrashAction(
  input: RestoreFromTrashInput
): Promise<ActionResult<null>> {
  try {
    const repository = await resolveRepositoryForAction();
    await repository.restoreFromTrash(input);
    return { ok: true, data: null };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function deleteTrashPostsAction(
  input: DeleteTrashPostsInput
): Promise<ActionResult<DeleteTrashPostsResult>> {
  try {
    const repository = await resolveRepositoryForAction();
    const data = await repository.deleteTrashPosts(input);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function emptyTrashAction(): Promise<ActionResult<EmptyTrashResult>> {
  try {
    const repository = await resolveRepositoryForAction();
    const data = await repository.emptyTrash();
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}
