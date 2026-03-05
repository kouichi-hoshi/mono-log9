import type { Session } from "next-auth";

import { getPrismaClient } from "@/lib/db/prisma";
import { PostRepositoryError } from "@/lib/posts/errors";

type SessionUserWithGoogleSub = {
  googleSub?: string | null;
  actorUserId?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

function toUnauthorizedError(): PostRepositoryError {
  return new PostRepositoryError("UNAUTHORIZED", "ログインが必要です");
}

export function getGoogleSubFromSession(session: Session | null): string {
  const user = session?.user as SessionUserWithGoogleSub | undefined;
  const googleSub = user?.googleSub?.trim();

  if (!googleSub) {
    throw toUnauthorizedError();
  }

  return googleSub;
}

export function getActorUserIdFromSession(session: Session | null): string | null {
  const user = session?.user as SessionUserWithGoogleSub | undefined;
  const actorUserId = user?.actorUserId?.trim();
  return actorUserId ? actorUserId : null;
}

export async function upsertActorUserByGoogleSub(input: {
  googleSub: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<string> {
  const prisma = (await getPrismaClient()) as {
    user: {
      upsert: (args: Record<string, unknown>) => Promise<{ id: string }>;
    };
  };

  const update: Record<string, unknown> = {};
  if (typeof input.email !== "undefined" && input.email !== null) {
    update.email = input.email;
  }
  if (typeof input.name !== "undefined" && input.name !== null) {
    update.name = input.name;
  }
  if (typeof input.image !== "undefined" && input.image !== null) {
    update.image = input.image;
  }

  const actor = await prisma.user.upsert({
    where: { googleSub: input.googleSub },
    create: {
      googleSub: input.googleSub,
      email: input.email ?? null,
      name: input.name ?? null,
      image: input.image ?? null,
    },
    update,
    select: { id: true },
  });

  return actor.id;
}

export async function ensureActorUserFromSession(session: Session | null): Promise<string> {
  const user = session?.user as SessionUserWithGoogleSub | undefined;
  const actorUserId = getActorUserIdFromSession(session);
  if (actorUserId) {
    return actorUserId;
  }

  const googleSub = getGoogleSubFromSession(session);
  return upsertActorUserByGoogleSub({
    googleSub,
    email: user?.email,
    name: user?.name,
    image: user?.image,
  });
}
