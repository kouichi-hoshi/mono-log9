-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "PostMode" AS ENUM ('memo', 'note');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('active', 'trashed');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "googleSub" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "authorId" UUID NOT NULL,
    "mode" "PostMode" NOT NULL,
    "title" VARCHAR(100),
    "content" JSONB NOT NULL,
    "contentText" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "status" "PostStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "trashedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- CreateIndex
CREATE INDEX "post_active_list_idx" ON "Post"("authorId", "status", "mode", "createdAt", "id");

-- CreateIndex
CREATE INDEX "post_active_fav_list_idx" ON "Post"("authorId", "status", "mode", "favorite", "createdAt", "id");

-- CreateIndex
CREATE INDEX "post_trash_list_idx" ON "Post"("authorId", "status", "trashedAt", "id");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "Post"
ADD CONSTRAINT "post_status_trashed_at_check"
CHECK (
  ("status" = 'active' AND "trashedAt" IS NULL) OR
  ("status" = 'trashed' AND "trashedAt" IS NOT NULL)
);
