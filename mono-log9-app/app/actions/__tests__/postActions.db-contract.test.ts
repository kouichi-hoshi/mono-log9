/**
 * postActions DB契約テスト（項番28 TC-036〜TC-040）
 * USE_STUB_POSTS=false で DB モードで postActions を実行
 * DATABASE_URL が有効である必要があります。
 */
import { PrismaClient } from "@prisma/client";

import {
  createPostAction,
  listPostsAction,
  updatePostAction,
} from "@/app/actions/postActions";
import { getPrismaClient } from "@/lib/db/prisma";
import { ensureSafeTestDatabaseOrThrow } from "@/lib/db/testDatabaseGuard";
import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import type { CreatePostInput, UpdatePostInput } from "@/lib/posts/types";

const TEST_SUB = "test-sub-28-contract";
const RUN_DB_INTEGRATION_TESTS = process.env.RUN_DB_INTEGRATION_TESTS === "true";
const describeDb = RUN_DB_INTEGRATION_TESTS ? describe : describe.skip;

jest.mock("@/lib/env", () => ({
  getStubPostsEnabled: jest.fn(() => false),
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(() =>
    Promise.resolve({
      user: {
        googleSub: TEST_SUB,
        email: null,
        name: null,
        image: null,
      },
    })
  ),
}));

describeDb("postActions db contract", () => {
  let prisma: PrismaClient;
  let actorUserId: string;

  beforeAll(async () => {
    await ensureSafeTestDatabaseOrThrow({ runner: "jest-db" });
    prisma = (await getPrismaClient()) as PrismaClient;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`DB接続確認に失敗しました。DATABASE_URL/DB起動状態を確認してください: ${reason}`);
    }
    const u = await prisma.user.upsert({
      where: { googleSub: TEST_SUB },
      create: { googleSub: TEST_SUB, email: null, name: null, image: null },
      update: {},
      select: { id: true },
    });
    actorUserId = u.id;
  });

  beforeEach(async () => {
    await prisma.post.deleteMany({ where: { authorId: actorUserId } });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    try {
      await prisma.post.deleteMany({ where: { authorId: actorUserId } });
      await prisma.user.deleteMany({ where: { googleSub: TEST_SUB } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it("TC-036: createPostAction (note) normal path", async () => {
    const content = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "タイトル" }] },
        { type: "paragraph", content: [{ type: "text", text: "本文" }] },
      ],
    };
    const result = await createPostAction({
      mode: "note",
      title: "ノート",
      content,
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.data).toHaveProperty("content");
      expect(result.data).toHaveProperty("contentText");
      expect(result.data.contentText).toContain("タイトル");
      expect(result.data.contentText).toContain("本文");
    }
  });

  it("TC-037: updatePostAction (note) normal path", async () => {
    const content = createDocFromPlainText("最初");
    const createResult = await createPostAction({
      mode: "note",
      title: "旧タイトル",
      content,
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;
    const postId = createResult.data.id;

    const newContent = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "新見出し" }] },
        { type: "paragraph", content: [{ type: "text", text: "新本文" }] },
      ],
    };

    const updateResult = await updatePostAction({
      postId,
      title: "新タイトル",
      content: newContent,
    });

    expect(updateResult).toMatchObject({ ok: true });
    if (updateResult.ok) {
      expect(updateResult.data.content).toEqual(newContent);
      expect(updateResult.data.contentText).toContain("新見出し");
      expect(updateResult.data.contentText).toContain("新本文");
      expect(updateResult.data.title).toBe("新タイトル");
    }
  });

  it("TC-038: listPostsAction (view=note) normal path", async () => {
    const content = createDocFromPlainText("ノート本文");
    await createPostAction({ mode: "note", content });

    const result = await listPostsAction({
      view: "note",
      favoriteOnly: false,
      limit: 10,
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.data.items.length).toBeGreaterThanOrEqual(1);
      const item = result.data.items[0];
      expect(item).toHaveProperty("content");
      expect(item).toHaveProperty("contentText");
    }
  });

  it("TC-039: createPostAction ignores client-provided contentText", async () => {
    const content = createDocFromPlainText("正しい本文");
    const result = await createPostAction({
      mode: "note",
      content,
      contentText: "改ざん値",
    } as unknown as CreatePostInput);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.data.contentText).not.toBe("改ざん値");
      expect(result.data.contentText).toBe(extractContentText(content, "note"));
    }
  });

  it("TC-040: updatePostAction ignores client-provided contentText", async () => {
    const content = createDocFromPlainText("最初");
    const createResult = await createPostAction({ mode: "note", content });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;
    const postId = createResult.data.id;

    const newContent = createDocFromPlainText("更新後本文");

    const updateResult = await updatePostAction({
      postId,
      content: newContent,
      contentText: "改ざん値",
    } as unknown as UpdatePostInput);

    expect(updateResult).toMatchObject({ ok: true });
    if (updateResult.ok) {
      expect(updateResult.data.contentText).not.toBe("改ざん値");
      expect(updateResult.data.contentText).toBe(
        extractContentText(newContent, "note")
      );
    }
  });
});
