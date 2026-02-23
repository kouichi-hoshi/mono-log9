import type { Session } from "next-auth";

import { getPrismaClient } from "@/lib/db/prisma";
import { PostRepositoryError } from "@/lib/posts/errors";

type SessionUserWithGoogleSub = {
  googleSub?: string | null;
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

export async function ensureActorUserFromSession(session: Session | null): Promise<string> {
  const user = session?.user as SessionUserWithGoogleSub | undefined;
  const googleSub = getGoogleSubFromSession(session);
  const prisma = (await getPrismaClient()) as {
    user: {
      upsert: (args: Record<string, unknown>) => Promise<{ id: string }>;
    };
  };

  const update: Record<string, unknown> = {};
  if (typeof user?.email !== "undefined" && user.email !== null) {
    update.email = user.email;
  }
  if (typeof user?.name !== "undefined" && user.name !== null) {
    update.name = user.name;
  }
  if (typeof user?.image !== "undefined" && user.image !== null) {
    update.image = user.image;
  }

  const actor = await prisma.user.upsert({
    where: { googleSub },
    create: {
      googleSub,
      email: user?.email ?? null,
      name: user?.name ?? null,
      image: user?.image ?? null,
    },
    update,
    select: { id: true },
  });

  return actor.id;
}
