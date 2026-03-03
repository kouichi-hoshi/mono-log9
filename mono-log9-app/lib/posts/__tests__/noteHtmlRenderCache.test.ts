import { createDocFromPlainText } from "@/lib/posts/content";
import {
  clearNoteHtmlRenderCacheForTest,
  computeAndCacheNoteHtml,
  getCachedNoteHtml,
} from "@/lib/posts/noteHtmlRenderCache";

describe("noteHtmlRenderCache", () => {
  beforeEach(() => {
    clearNoteHtmlRenderCacheForTest();
  });

  it("transitions from miss to hit after compute", () => {
    const content = createDocFromPlainText("本文");
    const input = {
      postId: "post-001",
      content,
      contentText: "本文",
      title: "タイトル",
    };

    expect(getCachedNoteHtml(input)).toBeUndefined();

    const computed = computeAndCacheNoteHtml(input);
    expect(computed).toContain("本文");

    expect(getCachedNoteHtml(input)).toBe(computed);
  });

  it("returns miss when contentText or title changes", () => {
    const content = createDocFromPlainText("本文");
    computeAndCacheNoteHtml({
      postId: "post-002",
      content,
      contentText: "本文",
      title: "タイトル",
    });

    expect(
      getCachedNoteHtml({
        postId: "post-002",
        content,
        contentText: "本文（変更）",
        title: "タイトル",
      })
    ).toBeUndefined();
    expect(
      getCachedNoteHtml({
        postId: "post-002",
        content,
        contentText: "本文",
        title: "タイトル（変更）",
      })
    ).toBeUndefined();
  });

  it("clears cache entries for tests", () => {
    const content = createDocFromPlainText("本文");
    const input = {
      postId: "post-003",
      content,
      contentText: "本文",
      title: "タイトル",
    };

    computeAndCacheNoteHtml(input);
    expect(getCachedNoteHtml(input)).toBeDefined();

    clearNoteHtmlRenderCacheForTest();
    expect(getCachedNoteHtml(input)).toBeUndefined();
  });
});
