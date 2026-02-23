import { PostRepositoryError } from "@/lib/posts/errors";

type PrismaModule = {
  PrismaClient: new () => unknown;
};

let prismaClientPromise: Promise<unknown> | null = null;

async function loadPrismaModule(): Promise<PrismaModule> {
  try {
    const moduleName = "@prisma/client";
    return (await import(moduleName)) as PrismaModule;
  } catch {
    throw new PostRepositoryError(
      "NOT_IMPLEMENTED",
      "Prisma が利用できません。依存関係をインストールしてください。"
    );
  }
}

export async function getPrismaClient(): Promise<unknown> {
  if (!prismaClientPromise) {
    prismaClientPromise = loadPrismaModule().then(({ PrismaClient }) => {
      return new PrismaClient();
    });
  }

  return prismaClientPromise;
}
