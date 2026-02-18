import {
  assertContentTextByMode,
  assertValidPostContent,
  createDocFromPlainText,
  extractContentText,
  normalizePostTitle,
} from "@/lib/posts/content";

describe("post content helpers", () => {
  it("extracts normalized text with memo one-line normalization", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: " 見出し " }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: " 1行目 " },
            { type: "hardBreak" },
            { type: "text", text: " 2行目 " },
          ],
        },
      ],
    };

    expect(extractContentText(content, "note")).toBe("見出し\n1行目\n2行目");
    expect(extractContentText(content, "memo")).toBe("見出し 1行目 2行目");
  });

  it("accepts allowed nodes and marks and rejects disallowed schema", () => {
    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "リンク",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
        ],
      })
    ).not.toThrow();

    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [{ type: "heading", attrs: { level: 1 } }],
      })
    ).toThrow(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
      })
    );
  });

  it("rejects invalid parent-child structures", () => {
    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [{ type: "text", text: "root text" }],
      })
    ).toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));

    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [{ type: "paragraph", content: [{ type: "text", text: "invalid" }] }],
          },
        ],
      })
    ).toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));

    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [
          {
            type: "paragraph",
            marks: [{ type: "bold" }],
            content: [{ type: "text", text: "invalid mark target" }],
          },
        ],
      })
    ).toThrow(expect.objectContaining({ code: "VALIDATION_ERROR" }));
  });

  it("accepts nullable optional fields coming through serialization boundaries", () => {
    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "見出し", marks: null }],
          },
          {
            type: "paragraph",
            content: null,
          },
        ],
      })
    ).not.toThrow();
  });

  it("accepts heading level serialized as string", () => {
    expect(() =>
      assertValidPostContent({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: "2" },
            content: [{ type: "text", text: "見出し" }],
          },
        ],
      })
    ).not.toThrow();
  });

  it("validates derived content text lengths by mode", () => {
    expect(() => assertContentTextByMode("a".repeat(281), "memo")).toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );

    expect(() => assertContentTextByMode("a".repeat(25001), "note")).toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );

    expect(() => assertContentTextByMode("", "memo")).toThrow(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );
  });

  it("normalizes note title and ignores memo title", () => {
    expect(normalizePostTitle("  タイトル  ", "note")).toBe("タイトル");
    expect(normalizePostTitle("   ", "note")).toBeUndefined();
    expect(normalizePostTitle("memo title", "memo")).toBeUndefined();
  });

  it("creates tiptap doc from plain text", () => {
    expect(createDocFromPlainText("a\nb")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a" },
            { type: "hardBreak" },
            { type: "text", text: "b" },
          ],
        },
      ],
    });
  });
});
