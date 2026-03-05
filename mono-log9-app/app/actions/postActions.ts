"use server";

import { headers } from "next/headers";

import { ensureActorUserFromSession } from "@/lib/auth/actorUser";
import { getStubPostsEnabled } from "@/lib/env";
import {
  isPostRepositoryError,
  PostRepositoryError,
  type PostErrorCode,
} from "@/lib/posts/errors";
import {
  toValidatedListPostsInput,
  toValidatedCreatePostDto,
  toValidatedUpdatePostDto,
  validatePostIdFormatByMode,
} from "@/lib/posts/inputValidation";
import { getActorPostRepository, postRepository } from "@/lib/posts/postRepository";
import type {
  CreatePostInput,
  DeleteTrashPostsInput,
  DeleteTrashPostsResult,
  EmptyTrashResult,
  FavoriteMutationResult,
  ActorGuardInput,
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

type ActionErrorResult = {
  ok: false;
  error: ActionError;
};

const E2E_SCENARIO_HEADER = "x-e2e-scenario";
const E2E_LIST_INITIAL_FAIL_ONCE = "list-initial-fail-once";
const consumedE2EScenarioKeys = new Set<string>();
const SLOW_LIST_ACTION_THRESHOLD_MS = 300;

function isPostActionPerfLogEnabled(): boolean {
  return process.env.POST_ACTION_PERF_LOG_ENABLED !== "false";
}

function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveLogEnv(): "prod" | "stg" | "dev" | "unknown" {
  const raw = (
    process.env.APP_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "unknown"
  ).toLowerCase();

  if (raw === "production" || raw === "prod") {
    return "prod";
  }
  if (raw === "preview" || raw === "stg" || raw === "stage" || raw === "staging") {
    return "stg";
  }
  if (raw === "development" || raw === "dev") {
    return "dev";
  }
  return "unknown";
}

function logPostActionPerf(
  action: string,
  payload: {
    env: "prod" | "stg" | "dev" | "unknown";
    requestId: string;
    repositoryMode: "stub" | "authjs";
    ok: boolean;
    totalMs: number;
    resolveRepositoryMs?: number;
    authImportMs?: number;
    authSessionMs?: number;
    ensureActorMs?: number;
    actorRepositoryMs?: number;
    repositoryMs?: number;
    input: Record<string, unknown>;
    errorCode?: PostErrorCode;
  }
): void {
  if (!isPostActionPerfLogEnabled()) {
    return;
  }
  console.info(
    JSON.stringify({
      event: "post_action_perf",
      action,
      ...payload,
      timestamp: new Date().toISOString(),
    })
  );
}

function toErrorResult(error: unknown): ActionErrorResult {
  // stg/Preview のみ: デバッグ用ログ（VERCEL_ENV=preview は Preview デプロイで自動設定）
  if (process.env.VERCEL_ENV === "preview") {
    console.error("[postActions] caught error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.cause) {
      console.error("[postActions] cause:", error.cause);
    }
  }

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

async function maybeFailListPostsOnceForE2E(input: ListPostsInput): Promise<void> {
  if (process.env.E2E_TEST_MODE !== "true") {
    return;
  }

  if (typeof input.cursor !== "undefined" && input.cursor !== null) {
    return;
  }

  const requestHeaders = await headers();
  const scenario = requestHeaders.get(E2E_SCENARIO_HEADER);
  if (scenario !== E2E_LIST_INITIAL_FAIL_ONCE) {
    return;
  }

  const scenarioKey = `${scenario}:${input.view}:${input.favoriteOnly}`;
  if (consumedE2EScenarioKeys.has(scenarioKey)) {
    return;
  }

  consumedE2EScenarioKeys.add(scenarioKey);
  throw new PostRepositoryError("INTERNAL_ERROR", "エラーが発生しました");
}

type ResolveRepositoryMetrics = {
  totalMs: number;
  authImportMs?: number;
  authSessionMs?: number;
  ensureActorMs?: number;
  actorRepositoryMs?: number;
};

async function resolveRepositoryForActionWithMetrics(): Promise<{
  repository: PostRepository;
  repositoryMode: "stub" | "authjs";
  actorUserId?: string;
  metrics: ResolveRepositoryMetrics;
}> {
  const startedAt = Date.now();

  if (getStubPostsEnabled()) {
    return {
      repository: postRepository,
      repositoryMode: "stub",
      metrics: {
        totalMs: Date.now() - startedAt,
      },
    };
  }

  const authImportStartedAt = Date.now();
  const { auth } = await import("@/auth");
  const authImportMs = Date.now() - authImportStartedAt;

  const authSessionStartedAt = Date.now();
  const session = await auth();
  const authSessionMs = Date.now() - authSessionStartedAt;

  const ensureActorStartedAt = Date.now();
  const actorUserId = await ensureActorUserFromSession(session);
  const ensureActorMs = Date.now() - ensureActorStartedAt;

  const actorRepositoryStartedAt = Date.now();
  const repository = getActorPostRepository(actorUserId);
  const actorRepositoryMs = Date.now() - actorRepositoryStartedAt;

  return {
    repository,
    repositoryMode: "authjs",
    actorUserId,
    metrics: {
      totalMs: Date.now() - startedAt,
      authImportMs,
      authSessionMs,
      ensureActorMs,
      actorRepositoryMs,
    },
  };
}

function throwSessionChangedError(): never {
  throw new PostRepositoryError("UNAUTHORIZED", "ログイン状態が変更されました。再ログインしてください");
}

function assertExpectedActorForAction(input: {
  repositoryMode: "stub" | "authjs";
  resolvedActorUserId?: string;
  expectedActorUserId?: string;
}): void {
  if (input.repositoryMode === "stub") {
    return;
  }

  if (!input.resolvedActorUserId) {
    throwSessionChangedError();
  }

  if (typeof input.expectedActorUserId !== "string" || input.expectedActorUserId.trim() === "") {
    throwSessionChangedError();
  }

  const expectedActorUserId = validatePostIdFormatByMode(input.expectedActorUserId, "db");
  if (expectedActorUserId !== input.resolvedActorUserId) {
    throwSessionChangedError();
  }
}

export async function listPostsAction(input: ListPostsInput): Promise<ActionResult<ListPostsResult>> {
  const requestId = createRequestId();
  const env = resolveLogEnv();
  const actionStartedAt = Date.now();
  let repositoryMode: "stub" | "authjs" = getStubPostsEnabled() ? "stub" : "authjs";
  let resolveRepositoryMs: number | undefined;
  let authImportMs: number | undefined;
  let authSessionMs: number | undefined;
  let ensureActorMs: number | undefined;
  let actorRepositoryMs: number | undefined;
  let repositoryMs: number | undefined;

  try {
    const validated = toValidatedListPostsInput(input);
    await maybeFailListPostsOnceForE2E(validated);

    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    repositoryMode = resolved.repositoryMode;
    resolveRepositoryMs = resolved.metrics.totalMs;
    authImportMs = resolved.metrics.authImportMs;
    authSessionMs = resolved.metrics.authSessionMs;
    ensureActorMs = resolved.metrics.ensureActorMs;
    actorRepositoryMs = resolved.metrics.actorRepositoryMs;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: validated.expectedActorUserId,
    });

    const repositoryStartedAt = Date.now();
    const data = await repository.listPosts(validated);
    repositoryMs = Date.now() - repositoryStartedAt;

    const totalMs = Date.now() - actionStartedAt;
    if (totalMs >= SLOW_LIST_ACTION_THRESHOLD_MS) {
      logPostActionPerf("listPostsAction", {
        env,
        requestId,
        repositoryMode,
        ok: true,
        totalMs,
        resolveRepositoryMs,
        authImportMs,
        authSessionMs,
        ensureActorMs,
        actorRepositoryMs,
        repositoryMs,
        input: {
          view: validated.view,
          favoriteOnly: validated.favoriteOnly,
          hasCursor: typeof validated.cursor !== "undefined" && validated.cursor !== null,
          limit: validated.limit ?? null,
        },
      });
    }

    return { ok: true, data };
  } catch (error) {
    const result = toErrorResult(error);
    logPostActionPerf("listPostsAction", {
      env,
      requestId,
      repositoryMode,
      ok: false,
      totalMs: Date.now() - actionStartedAt,
      resolveRepositoryMs,
      authImportMs,
      authSessionMs,
      ensureActorMs,
      actorRepositoryMs,
      repositoryMs,
      input: {
        view: input.view,
        favoriteOnly: input.favoriteOnly,
        hasCursor: typeof input.cursor !== "undefined" && input.cursor !== null,
        limit: input.limit ?? null,
      },
      errorCode: result.error.code,
    });
    return result;
  }
}

export async function createPostAction(input: CreatePostInput): Promise<ActionResult<PostRecord>> {
  try {
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
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
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
    const validated = toValidatedUpdatePostDto(input, {
      postIdMode: stubPostsEnabled ? "stub" : "db",
    });
    const data = await repository.updatePost(validated);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function setFavoriteAction(
  input: SetFavoriteInput
): Promise<ActionResult<FavoriteMutationResult>> {
  const requestId = createRequestId();
  const env = resolveLogEnv();
  const actionStartedAt = Date.now();
  let repositoryMode: "stub" | "authjs" = getStubPostsEnabled() ? "stub" : "authjs";
  let resolveRepositoryMs: number | undefined;
  let authImportMs: number | undefined;
  let authSessionMs: number | undefined;
  let ensureActorMs: number | undefined;
  let actorRepositoryMs: number | undefined;
  let repositoryMs: number | undefined;

  try {
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    repositoryMode = resolved.repositoryMode;
    resolveRepositoryMs = resolved.metrics.totalMs;
    authImportMs = resolved.metrics.authImportMs;
    authSessionMs = resolved.metrics.authSessionMs;
    ensureActorMs = resolved.metrics.ensureActorMs;
    actorRepositoryMs = resolved.metrics.actorRepositoryMs;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });

    const repositoryStartedAt = Date.now();
    const data = await repository.setFavorite({
      ...input,
      diagnosticsRequestId: requestId,
    });
    repositoryMs = Date.now() - repositoryStartedAt;

    logPostActionPerf("setFavoriteAction", {
      env,
      requestId,
      repositoryMode,
      ok: true,
      totalMs: Date.now() - actionStartedAt,
      resolveRepositoryMs,
      authImportMs,
      authSessionMs,
      ensureActorMs,
      actorRepositoryMs,
      repositoryMs,
      input: {
        postId: input.postId,
        favorite: input.favorite,
      },
    });

    return { ok: true, data };
  } catch (error) {
    const result = toErrorResult(error);
    logPostActionPerf("setFavoriteAction", {
      env,
      requestId,
      repositoryMode,
      ok: false,
      totalMs: Date.now() - actionStartedAt,
      resolveRepositoryMs,
      authImportMs,
      authSessionMs,
      ensureActorMs,
      actorRepositoryMs,
      repositoryMs,
      input: {
        postId: input.postId,
        favorite: input.favorite,
      },
      errorCode: result.error.code,
    });
    return result;
  }
}

export async function moveToTrashAction(input: MoveToTrashInput): Promise<ActionResult<null>> {
  try {
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
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
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
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
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
    const data = await repository.deleteTrashPosts(input);
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function emptyTrashAction(
  input: ActorGuardInput = {}
): Promise<ActionResult<EmptyTrashResult>> {
  try {
    const resolved = await resolveRepositoryForActionWithMetrics();
    const repository = resolved.repository;
    assertExpectedActorForAction({
      repositoryMode: resolved.repositoryMode,
      resolvedActorUserId: resolved.actorUserId,
      expectedActorUserId: input.expectedActorUserId,
    });
    const data = await repository.emptyTrash();
    return { ok: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}
