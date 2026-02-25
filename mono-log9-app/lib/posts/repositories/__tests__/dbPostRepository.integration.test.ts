/**
 * DB接続統合テスト（項番28）
 * DATABASE_URL が有効である必要があります。
 * テスト用 googleSub: test-sub-28-a, test-sub-28-b でユーザーを隔離
 */
import { PrismaClient } from "@prisma/client";

import {
  assertValidPostContent,
  createDocFromPlainText,
  extractContentText,
} from "@/lib/posts/content";
import { toSanitizableHtml } from "@/lib/posts/contentHtml";
import { getPrismaClient } from "@/lib/db/prisma";
import { ensureSafeTestDatabaseOrThrow } from "@/lib/db/testDatabaseGuard";
import { createDbPostRepository } from "@/lib/posts/repositories/dbPostRepository";
import type { PostContent } from "@/lib/posts/types";

const TEST_SUB_A = "test-sub-28-a";
const TEST_SUB_B = "test-sub-28-b";
const RUN_DB_INTEGRATION_TESTS = process.env.RUN_DB_INTEGRATION_TESTS === "true";
const describeDb = RUN_DB_INTEGRATION_TESTS ? describe : describe.skip;

function makeNoteContent(
  parts: Array<
    | { type: "heading"; level: number; text: string }
    | { type: "paragraph"; text: string; marks?: Array<{ type: "bold" } | { type: "link"; href: string }> }
    | { type: "blockquote"; text: string }
    | { type: "bulletList"; items: string[] }
    | { type: "orderedList"; items: string[] }
  >
): PostContent {
  const content: NonNullable<PostContent["content"]> = [];

  for (const p of parts) {
    if (p.type === "heading") {
      content.push({
        type: "heading",
        attrs: { level: p.level },
        content: [{ type: "text", text: p.text }],
      });
    } else if (p.type === "paragraph") {
      const inlines = p.marks
        ? p.marks.map((m) =>
            m.type === "bold"
              ? { type: "text" as const, text: p.text, marks: [{ type: "bold" as const }] }
              : { type: "text" as const, text: p.text, marks: [{ type: "link" as const, attrs: { href: m.href } }] }
          )
        : [{ type: "text" as const, text: p.text }];
      content.push({ type: "paragraph", content: inlines });
    } else if (p.type === "blockquote") {
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: p.text }],
          },
        ],
      });
    } else if (p.type === "bulletList") {
      content.push({
        type: "bulletList",
        content: p.items.map((text) => ({
          type: "listItem" as const,
          content: [
            {
              type: "paragraph" as const,
              content: [{ type: "text" as const, text }],
            },
          ],
        })),
      });
    } else if (p.type === "orderedList") {
      content.push({
        type: "orderedList",
        content: p.items.map((text) => ({
          type: "listItem" as const,
          content: [
            {
              type: "paragraph" as const,
              content: [{ type: "text" as const, text }],
            },
          ],
        })),
      });
    }
  }

  return { type: "doc", content };
}

describeDb("dbPostRepository integration", () => {
  let prisma: PrismaClient;
  let actorUserIdA: string;
  let actorUserIdB: string;
  let repoA: ReturnType<typeof createDbPostRepository>;
  let repoB: ReturnType<typeof createDbPostRepository>;

  beforeAll(async () => {
    await ensureSafeTestDatabaseOrThrow({ runner: "jest-db" });
    prisma = (await getPrismaClient()) as PrismaClient;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`DB接続確認に失敗しました。DATABASE_URL/DB起動状態を確認してください: ${reason}`);
    }
    const uA = await prisma.user.upsert({
      where: { googleSub: TEST_SUB_A },
      create: { googleSub: TEST_SUB_A, email: null, name: null, image: null },
      update: {},
      select: { id: true },
    });
    const uB = await prisma.user.upsert({
      where: { googleSub: TEST_SUB_B },
      create: { googleSub: TEST_SUB_B, email: null, name: null, image: null },
      update: {},
      select: { id: true },
    });
    actorUserIdA = uA.id;
    actorUserIdB = uB.id;
    repoA = createDbPostRepository({ actorUserId: actorUserIdA });
    repoB = createDbPostRepository({ actorUserId: actorUserIdB });
  });

  beforeEach(async () => {
    await prisma.post.deleteMany({ where: { authorId: actorUserIdA } });
    await prisma.post.deleteMany({ where: { authorId: actorUserIdB } });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }
    try {
      await prisma.post.deleteMany({ where: { authorId: actorUserIdA } });
      await prisma.post.deleteMany({ where: { authorId: actorUserIdB } });
      await prisma.user.deleteMany({
        where: { googleSub: { in: [TEST_SUB_A, TEST_SUB_B] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  describe("B. content/contentText roundtrip (TC-011〜TC-018)", () => {
    it("TC-011: memo plain text save→get", async () => {
      const content = createDocFromPlainText("メモ本文");
      const contentText = extractContentText(content, "memo");
      await repoA.createPost({
        mode: "memo",
        content,
        contentText,
      });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listed.items).toHaveLength(1);
      const item = listed.items[0];
      expect(item.content).toEqual(content);
      expect(item.contentText).toBe("メモ本文");
    });

    it("TC-012: note heading+paragraph save→get", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "見出し" },
        { type: "paragraph", text: "本文" },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0].content).toEqual(content);
    });

    it("TC-013: note full nodes+marks save→get", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "H" },
        {
          type: "paragraph",
          text: "b",
          marks: [{ type: "bold" }, { type: "link", href: "https://example.com" }],
        },
        { type: "blockquote", text: "q" },
        { type: "bulletList", items: ["ul1"] },
        { type: "orderedList", items: ["ol1"] },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0].content).toEqual(content);
    });

    it("TC-014: note hardBreak in content save→get", async () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "前" },
              { type: "hardBreak" },
              { type: "text", text: "後" },
            ],
          },
        ],
      };
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items).toHaveLength(1);
      const c = (listed.items[0].content as { content?: Array<{ content?: Array<{ type: string }> }> })
        .content?.[0]?.content;
      expect(c?.some((n) => (n as { type?: string }).type === "hardBreak")).toBe(true);
    });

    it("TC-015: memo contentText single-line via DB", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "見出し" },
        { type: "paragraph", text: "行1" },
        { type: "paragraph", text: "行2" },
      ]);
      const contentText = extractContentText(content, "memo");
      await repoA.createPost({ mode: "memo", content, contentText });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].contentText).not.toMatch(/\n/);
      expect(listed.items[0].contentText.trim()).toBeTruthy();
    });

    it("TC-016: note contentText keeps newlines via DB", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "見出し" },
        { type: "paragraph", text: "行1" },
        { type: "paragraph", text: "行2" },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].contentText).toContain("\n");
    });

    it("TC-017: note title save→get trimmed", async () => {
      const content = createDocFromPlainText("本文");
      const contentText = extractContentText(content, "note");
      await repoA.createPost({
        mode: "note",
        title: "  タイトル  ",
        content,
        contentText,
      });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].title).toBe("タイトル");
    });

    it("TC-018: memo no title → undefined", async () => {
      const content = createDocFromPlainText("メモ");
      const contentText = extractContentText(content, "memo");
      await repoA.createPost({ mode: "memo", content, contentText });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].title).toBeUndefined();
    });
  });

  describe("C. updatePost contentText re-derivation (TC-019〜TC-022)", () => {
    it("TC-019: memo updatePost re-derives contentText", async () => {
      const c1 = createDocFromPlainText("最初");
      await repoA.createPost({ mode: "memo", content: c1, contentText: extractContentText(c1, "memo") });
      const listed1 = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      const postId = listed1.items[0].id;
      const c2 = createDocFromPlainText("更新後");
      await repoA.updatePost({ postId, content: c2 });
      const listed2 = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listed2.items[0].contentText).toBe("更新後");
    });

    it("TC-020: note updatePost re-derives contentText", async () => {
      const c1 = makeNoteContent([
        { type: "heading", level: 2, text: "H" },
        { type: "paragraph", text: "P" },
      ]);
      await repoA.createPost({ mode: "note", content: c1, contentText: extractContentText(c1, "note") });
      const listed1 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const postId = listed1.items[0].id;
      const c2 = makeNoteContent([
        { type: "heading", level: 2, text: "新H" },
        { type: "blockquote", text: "引用" },
      ]);
      await repoA.updatePost({ postId, content: c2 });
      const listed2 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed2.items[0].contentText).toContain("新H");
      expect(listed2.items[0].contentText).toContain("引用");
    });

    it("TC-021: note updatePost updates title", async () => {
      const content = createDocFromPlainText("本文");
      await repoA.createPost({
        mode: "note",
        title: "旧タイトル",
        content,
        contentText: extractContentText(content, "note"),
      });
      const listed1 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const postId = listed1.items[0].id;
      await repoA.updatePost({ postId, title: "新タイトル", content });
      const listed2 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed2.items[0].title).toBe("新タイトル");
    });

    it("TC-022: note updatePost empty title → undefined", async () => {
      const content = createDocFromPlainText("本文");
      await repoA.createPost({
        mode: "note",
        title: "タイトル",
        content,
        contentText: extractContentText(content, "note"),
      });
      const listed1 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const postId = listed1.items[0].id;
      await repoA.updatePost({ postId, title: "  ", content });
      const listed2 = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed2.items[0].title).toBeUndefined();
    });
  });

  describe("D. Prisma Json → generateHTML compatibility (TC-023〜TC-026)", () => {
    it("TC-023: DB content → toSanitizableHtml returns HTML", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "H" },
        {
          type: "paragraph",
          text: "b",
          marks: [{ type: "bold" }, { type: "link", href: "https://example.com" }],
        },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const html = toSanitizableHtml(listed.items[0].content);
      expect(html).toBeTruthy();
      expect(typeof html).toBe("string");
    });

    it("TC-024: DB content → HTML contains expected tags", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "H" },
        {
          type: "paragraph",
          text: "b",
          marks: [{ type: "bold" }, { type: "link", href: "https://example.com" }],
        },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const html = toSanitizableHtml(listed.items[0].content);
      expect(html).toContain("<h2>");
      expect(html).toContain("<strong>");
      expect(html).toContain('href="https://example.com"');
    });

    it("TC-025: blockquote+list content → DB → HTML", async () => {
      const content = makeNoteContent([
        { type: "blockquote", text: "Q" },
        { type: "bulletList", items: ["ul"] },
        { type: "orderedList", items: ["ol"] },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const html = toSanitizableHtml(listed.items[0].content);
      expect(html).toContain("<blockquote>");
      expect(html).toContain("<ul>");
      expect(html).toContain("<ol>");
    });

    it("TC-026: DB content passes assertValidPostContent", async () => {
      const content = makeNoteContent([
        { type: "heading", level: 2, text: "H" },
        {
          type: "paragraph",
          text: "b",
          marks: [{ type: "bold" }, { type: "link", href: "https://example.com" }],
        },
      ]);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(() => assertValidPostContent(listed.items[0].content)).not.toThrow();
    });
  });

  describe("E. boundary/edge cases (TC-027〜TC-033)", () => {
    it("TC-027: memo 280 chars → OK", async () => {
      const text = "あ".repeat(280);
      const content = createDocFromPlainText(text);
      const contentText = extractContentText(content, "memo");
      await repoA.createPost({ mode: "memo", content, contentText });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].contentText).toHaveLength(280);
    });

    it("TC-028: memo 281 chars → VALIDATION_ERROR", async () => {
      const text = "あ".repeat(281);
      const content = createDocFromPlainText(text);
      const contentText = extractContentText(content, "memo");
      await expect(
        repoA.createPost({ mode: "memo", content, contentText })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("TC-029: note 25000 chars → OK", async () => {
      const text = "あ".repeat(25000);
      const content = createDocFromPlainText(text);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      expect(listed.items[0].contentText).toHaveLength(25000);
    });

    it("TC-030: note 25001 chars → VALIDATION_ERROR", async () => {
      const text = "あ".repeat(25001);
      const content = createDocFromPlainText(text);
      const contentText = extractContentText(content, "note");
      await expect(
        repoA.createPost({ mode: "note", content, contentText })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("TC-031: empty content → VALIDATION_ERROR", async () => {
      const content: PostContent = { type: "doc", content: [{ type: "paragraph" }] };
      const contentText = extractContentText(content, "memo");
      await expect(
        repoA.createPost({ mode: "memo", content, contentText })
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "内容を入力してください",
      });
    });

    it("TC-032: heading level string '2' → normalized to number 2", async () => {
      const content = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: "2" },
            content: [{ type: "text", text: "H" }],
          },
        ],
      } as PostContent;
      assertValidPostContent(content);
      const contentText = extractContentText(content, "note");
      await repoA.createPost({ mode: "note", content, contentText });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const heading = (listed.items[0].content as { content?: Array<{ attrs?: { level?: unknown } }> })
        .content?.[0];
      expect(heading?.attrs?.level).toBe(2);
    });

    it("TC-033: title 101 chars → VALIDATION_ERROR", async () => {
      const content = createDocFromPlainText("本文");
      const contentText = extractContentText(content, "note");
      await expect(
        repoA.createPost({
          mode: "note",
          title: "あ".repeat(101),
          content,
          contentText,
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });
  });

  describe("F. auth boundary (TC-034〜TC-035)", () => {
    it("TC-034: updatePost other user's post → NOT_FOUND", async () => {
      const content = createDocFromPlainText("Aの投稿");
      const contentText = extractContentText(content, "memo");
      const created = await repoA.createPost({ mode: "memo", content, contentText });
      await expect(
        repoB.updatePost({ postId: created.id, content: createDocFromPlainText("改ざん") })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("TC-035: listPosts does not include other user's posts", async () => {
      const content = createDocFromPlainText("Aの投稿");
      const contentText = extractContentText(content, "memo");
      await repoA.createPost({ mode: "memo", content, contentText });
      const contentB = createDocFromPlainText("Bの投稿");
      await repoB.createPost({
        mode: "memo",
        content: contentB,
        contentText: extractContentText(contentB, "memo"),
      });
      const listedA = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listedA.items).toHaveLength(1);
      expect(listedA.items[0].contentText).toBe("Aの投稿");
      const listedB = await repoB.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      expect(listedB.items).toHaveLength(1);
      expect(listedB.items[0].contentText).toBe("Bの投稿");
    });
  });

  describe("H. updatePost boundary (TC-041〜TC-043)", () => {
    it("TC-041: memo update 281 chars → VALIDATION_ERROR", async () => {
      const content = createDocFromPlainText("最初");
      await repoA.createPost({ mode: "memo", content, contentText: extractContentText(content, "memo") });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      const postId = listed.items[0].id;
      const longContent = createDocFromPlainText("あ".repeat(281));
      await expect(
        repoA.updatePost({ postId, content: longContent })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("TC-042: note update 25001 chars → VALIDATION_ERROR", async () => {
      const content = createDocFromPlainText("最初");
      await repoA.createPost({ mode: "note", content, contentText: extractContentText(content, "note") });
      const listed = await repoA.listPosts({ view: "note", favoriteOnly: false, limit: 10 });
      const postId = listed.items[0].id;
      const longContent = createDocFromPlainText("あ".repeat(25001));
      await expect(
        repoA.updatePost({ postId, content: longContent })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("TC-043: updatePost empty content → VALIDATION_ERROR", async () => {
      const content = createDocFromPlainText("最初");
      await repoA.createPost({ mode: "memo", content, contentText: extractContentText(content, "memo") });
      const listed = await repoA.listPosts({ view: "memo", favoriteOnly: false, limit: 10 });
      const postId = listed.items[0].id;
      const emptyContent: PostContent = { type: "doc", content: [{ type: "paragraph" }] };
      await expect(
        repoA.updatePost({ postId, content: emptyContent })
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "内容を入力してください",
      });
    });
  });
});
