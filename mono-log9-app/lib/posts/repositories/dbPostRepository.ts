import { getPrismaClient } from "@/lib/db/prisma";
import { encodePostsCursor, parseCursorInput } from "@/lib/posts/cursor";
import { formatJstDateTime } from "@/lib/posts/dateTime";
import { PostRepositoryError } from "@/lib/posts/errors";
import {
  normalizeListLimit,
  validatePostIdFormatByMode,
} from "@/lib/posts/inputValidation";
import {
  assertContentTextByMode,
  assertValidPostContent,
  extractContentText,
  normalizePostTitle,
} from "@/lib/posts/content";
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

type CreateDbPostRepositoryInput = {
  actorUserId: string;
};

type DbPostRow = {
  id: string;
  mode: "memo" | "note";
  title: string | null;
  content: unknown;
  contentText: string;
  favorite: boolean;
  createdAt: Date;
  trashedAt: Date | null;
  status: "active" | "trashed";
};

const INVALID_INPUT_MESSAGE = "入力内容に不備があります";
const NOT_FOUND_MESSAGE = "対象が見つかりません";
const INTERNAL_ERROR_MESSAGE = "エラーが発生しました";

const VALIDATION_ERROR_CODES = new Set([
  "P2000",
  "P2001",
  "P2002",
  "P2003",
  "P2004",
  "P2005",
  "P2006",
  "P2007",
  "P2011",
  "P2012",
  "P2013",
  "P2014",
  "P2020",
]);

const POST_SELECT = {
  id: true,
  mode: true,
  title: true,
  content: true,
  contentText: true,
  favorite: true,
  createdAt: true,
  trashedAt: true,
  status: true,
} as const;

function throwValidationError(message = INVALID_INPUT_MESSAGE): never {
  throw new PostRepositoryError("VALIDATION_ERROR", message);
}

function throwInvalidCursorError(): never {
  throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
}

function mapPrismaError(error: unknown): PostRepositoryError {
  if (error instanceof PostRepositoryError) {
    return error;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      if (code === "P2025") {
        return new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }
      if (VALIDATION_ERROR_CODES.has(code)) {
        return new PostRepositoryError("VALIDATION_ERROR", INVALID_INPUT_MESSAGE);
      }
    }
  }

  return new PostRepositoryError("INTERNAL_ERROR", INTERNAL_ERROR_MESSAGE);
}

async function runPrisma<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw mapPrismaError(error);
  }
}

function toPostRecord(row: DbPostRow): PostRecord {
  return {
    id: row.id,
    mode: row.mode,
    title: row.title ?? undefined,
    content: row.content as PostRecord["content"],
    contentText: row.contentText,
    favorite: row.favorite,
    createdAt: formatJstDateTime(row.createdAt),
    createdAtEpochMs: row.createdAt.getTime(),
    trashedAt: row.trashedAt ? formatJstDateTime(row.trashedAt) : undefined,
    trashedAtEpochMs: row.trashedAt ? row.trashedAt.getTime() : undefined,
  };
}

function ensurePostIdUuid(postId: string): string {
  return validatePostIdFormatByMode(postId, "db");
}

function normalizeDeletePostIds(input: DeleteTrashPostsInput): string[] {
  if (!Array.isArray(input.postIds)) {
    throwValidationError();
  }

  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of input.postIds) {
    const normalized = ensurePostIdUuid(id);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function buildBaseListWhere(input: ListPostsInput, actorUserId: string): Record<string, unknown> {
  if (input.view === "trash") {
    return {
      authorId: actorUserId,
      status: "trashed",
    };
  }

  return {
    authorId: actorUserId,
    status: "active",
    mode: input.view,
    ...(input.favoriteOnly ? { favorite: true } : {}),
  };
}

function getSortField(view: ListPostsInput["view"]): "createdAt" | "trashedAt" {
  return view === "trash" ? "trashedAt" : "createdAt";
}

function getSortDateFromRow(
  row: Pick<DbPostRow, "createdAt" | "trashedAt">,
  sortField: "createdAt" | "trashedAt"
): Date {
  const sortDate = row[sortField];
  if (!(sortDate instanceof Date)) {
    throwInvalidCursorError();
  }
  return sortDate;
}

export function createDbPostRepository({ actorUserId }: CreateDbPostRepositoryInput): PostRepository {
  const repository: PostRepository = {
    async listPosts(input: ListPostsInput): Promise<ListPostsResult> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findFirst: (args: Record<string, unknown>) => Promise<DbPostRow | null>;
          findMany: (args: Record<string, unknown>) => Promise<DbPostRow[]>;
        };
      };
      const limit = normalizeListLimit(input.limit);
      const baseWhere = buildBaseListWhere(input, actorUserId);
      const sortField = getSortField(input.view);

      let pagingWhere: Record<string, unknown> = {};
      const parsedCursor = parseCursorInput(input.cursor);
      if (parsedCursor.kind !== "none") {
        const anchor = await runPrisma(() =>
          prisma.post.findFirst({
            where: {
              ...baseWhere,
              id: parsedCursor.id,
            },
            select: {
              id: true,
              createdAt: true,
              trashedAt: true,
            },
          })
        );
        if (!anchor) {
          throwInvalidCursorError();
        }

        const anchorDate = getSortDateFromRow(anchor, sortField);
        const anchorIso = anchorDate.toISOString();
        if (parsedCursor.t !== anchorIso) {
          throwInvalidCursorError();
        }

        pagingWhere = {
          OR: [
            { [sortField]: { lt: anchorDate } },
            {
              AND: [{ [sortField]: anchorDate }, { id: { lt: anchor.id } }],
            },
          ],
        };
      }

      const rows = await runPrisma(() =>
        prisma.post.findMany({
          where: {
            ...baseWhere,
            ...pagingWhere,
          },
          orderBy: [{ [sortField]: "desc" }, { id: "desc" }],
          take: limit + 1,
          select: POST_SELECT,
        })
      );

      const hasNext = rows.length > limit;
      const sliced = hasNext ? rows.slice(0, limit) : rows;
      const items = sliced.map((row) => toPostRecord(row));
      const last = sliced[sliced.length - 1];
      const nextCursor =
        hasNext && last
          ? encodePostsCursor({
              v: 1,
              t: getSortDateFromRow(last, sortField).toISOString(),
              id: last.id,
            })
          : null;

      return {
        items,
        hasNext,
        nextCursor,
      };
    },

    async createPost(input: ValidatedCreatePostDto): Promise<PostRecord> {
      const prisma = (await getPrismaClient()) as {
        post: {
          create: (args: Record<string, unknown>) => Promise<DbPostRow>;
        };
      };
      assertValidPostContent(input.content);
      const normalizedTitle = normalizePostTitle(input.title, input.mode);
      const derivedContentText = extractContentText(input.content, input.mode);
      if (derivedContentText !== input.contentText) {
        throwValidationError();
      }
      assertContentTextByMode(input.contentText, input.mode);

      const created = await runPrisma(() =>
        prisma.post.create({
          data: {
            authorId: actorUserId,
            mode: input.mode,
            title: normalizedTitle ?? null,
            content: input.content,
            contentText: input.contentText,
            favorite: false,
            status: "active",
            trashedAt: null,
          },
          select: POST_SELECT,
        })
      );

      return toPostRecord(created);
    },

    async updatePost(input: ValidatedUpdatePostDto): Promise<PostRecord> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findFirst: (args: Record<string, unknown>) => Promise<DbPostRow | null>;
          update: (args: Record<string, unknown>) => Promise<DbPostRow>;
        };
      };
      const postId = ensurePostIdUuid(input.postId);
      assertValidPostContent(input.content);

      const existing = await runPrisma(() =>
        prisma.post.findFirst({
          where: { id: postId, authorId: actorUserId },
          select: POST_SELECT,
        })
      );
      if (!existing) {
        throw new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }

      const normalizedTitle = normalizePostTitle(input.title, existing.mode);
      const contentText = extractContentText(input.content, existing.mode);
      assertContentTextByMode(contentText, existing.mode);

      const updated = await runPrisma(() =>
        prisma.post.update({
          where: { id: existing.id },
          data: {
            title: normalizedTitle ?? null,
            content: input.content,
            contentText,
          },
          select: POST_SELECT,
        })
      );

      return toPostRecord(updated);
    },

    async setFavorite(input: SetFavoriteInput): Promise<PostRecord> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findFirst: (args: Record<string, unknown>) => Promise<DbPostRow | null>;
          update: (args: Record<string, unknown>) => Promise<DbPostRow>;
        };
      };
      const postId = ensurePostIdUuid(input.postId);
      if (typeof input.favorite !== "boolean") {
        throwValidationError();
      }

      const existing = await runPrisma(() =>
        prisma.post.findFirst({
          where: { id: postId, authorId: actorUserId },
          select: POST_SELECT,
        })
      );
      if (!existing) {
        throw new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }

      if (existing.favorite === input.favorite) {
        return toPostRecord(existing);
      }

      const updated = await runPrisma(() =>
        prisma.post.update({
          where: { id: existing.id },
          data: { favorite: input.favorite },
          select: POST_SELECT,
        })
      );
      return toPostRecord(updated);
    },

    async moveToTrash(input: MoveToTrashInput): Promise<void> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findFirst: (args: Record<string, unknown>) => Promise<DbPostRow | null>;
          update: (args: Record<string, unknown>) => Promise<DbPostRow>;
        };
      };
      const postId = ensurePostIdUuid(input.postId);
      const existing = await runPrisma(() =>
        prisma.post.findFirst({
          where: { id: postId, authorId: actorUserId },
          select: POST_SELECT,
        })
      );
      if (!existing) {
        throw new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }

      if (existing.status === "trashed") {
        return;
      }

      await runPrisma(() =>
        prisma.post.update({
          where: { id: existing.id },
          data: {
            status: "trashed",
            trashedAt: new Date(),
          },
          select: { id: true },
        })
      );
    },

    async restoreFromTrash(input: RestoreFromTrashInput): Promise<void> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findFirst: (args: Record<string, unknown>) => Promise<DbPostRow | null>;
          update: (args: Record<string, unknown>) => Promise<DbPostRow>;
        };
      };
      const postId = ensurePostIdUuid(input.postId);
      const existing = await runPrisma(() =>
        prisma.post.findFirst({
          where: { id: postId, authorId: actorUserId },
          select: POST_SELECT,
        })
      );
      if (!existing) {
        throw new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }

      if (existing.status === "active") {
        return;
      }

      await runPrisma(() =>
        prisma.post.update({
          where: { id: existing.id },
          data: {
            status: "active",
            trashedAt: null,
          },
          select: { id: true },
        })
      );
    },

    async deleteTrashPosts(input: DeleteTrashPostsInput): Promise<DeleteTrashPostsResult> {
      const prisma = (await getPrismaClient()) as {
        post: {
          findMany: (args: Record<string, unknown>) => Promise<Array<{ id: string }>>;
          deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
        };
      };
      const postIds = normalizeDeletePostIds(input);
      if (postIds.length === 0) {
        return { deletedPostIds: [] };
      }

      const existing = await runPrisma(() =>
        prisma.post.findMany({
          where: {
            id: { in: postIds },
            authorId: actorUserId,
            status: "trashed",
          },
          select: { id: true },
        })
      );
      if (existing.length !== postIds.length) {
        throw new PostRepositoryError("NOT_FOUND", NOT_FOUND_MESSAGE);
      }

      await runPrisma(() =>
        prisma.post.deleteMany({
          where: {
            id: { in: postIds },
            authorId: actorUserId,
            status: "trashed",
          },
        })
      );

      return {
        deletedPostIds: postIds,
      };
    },

    async emptyTrash(): Promise<EmptyTrashResult> {
      const prisma = (await getPrismaClient()) as {
        post: {
          deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
        };
      };
      const result = await runPrisma(() =>
        prisma.post.deleteMany({
          where: {
            authorId: actorUserId,
            status: "trashed",
          },
        })
      );

      return {
        deletedCount: result.count,
      };
    },
  };

  return repository;
}
