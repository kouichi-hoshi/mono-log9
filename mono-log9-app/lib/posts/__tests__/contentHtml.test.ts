import { toSanitizableHtml } from "@/lib/posts/contentHtml";
import type { PostContent } from "@/lib/posts/types";

describe("toSanitizableHtml", () => {
  describe("TC-001: paragraph → HTML", () => {
    it("generates HTML for paragraph with text", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "本文" }],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<p>");
      expect(result).toContain("本文");
      expect(result).toContain("</p>");
    });
  });

  describe("TC-002: heading H2/H3/H4", () => {
    it("generates HTML for heading level 2", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "H2" }] },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<h2>");
      expect(result).toContain("H2");
    });

    it("generates HTML for heading level 3", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "H3" }] },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<h3>");
      expect(result).toContain("H3");
    });

    it("generates HTML for heading level 4", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "H4" }] },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<h4>");
      expect(result).toContain("H4");
    });
  });

  describe("TC-003: blockquote", () => {
    it("generates HTML for blockquote with paragraph", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "引用文" }],
              },
            ],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<blockquote>");
      expect(result).toContain("引用文");
    });
  });

  describe("TC-004: bulletList/orderedList", () => {
    it("generates HTML for bulletList", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "項目1" }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<ul>");
      expect(result).toContain("<li>");
      expect(result).toContain("項目1");
    });

    it("generates HTML for orderedList", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "番号1" }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<ol>");
      expect(result).toContain("<li>");
      expect(result).toContain("番号1");
    });
  });

  describe("TC-005: bold mark", () => {
    it("generates HTML for bold text", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "太字",
                marks: [{ type: "bold" }],
              },
            ],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<strong>");
      expect(result).toContain("太字");
    });
  });

  describe("TC-006: link mark", () => {
    it("generates HTML for link", () => {
      const content: PostContent = {
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
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<a");
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain("リンク");
    });
  });

  describe("TC-007: hardBreak", () => {
    it("generates HTML for hardBreak between text nodes", () => {
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
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("前");
      expect(result).toContain("後");
      expect(result).toMatch(/<br\s*\/?>|<\/br>/i);
    });
  });

  describe("TC-008: empty paragraph", () => {
    it("returns HTML for empty paragraph without throwing", () => {
      const content: PostContent = {
        type: "doc",
        content: [{ type: "paragraph" }],
      };
      const result = toSanitizableHtml(content);
      expect(result).not.toBeNull();
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });
  });

  describe("TC-009: composite rich content", () => {
    it("generates HTML containing all node and mark tags", () => {
      const content: PostContent = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "見出し" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "太字",
                marks: [{ type: "bold" }],
              },
              { type: "text", text: " " },
              {
                type: "text",
                text: "リンク",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "引用" }],
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "箇条書き" }],
                  },
                ],
              },
            ],
          },
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "番号" }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = toSanitizableHtml(content);
      expect(result).toBeTruthy();
      expect(result).toContain("<h2>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<a");
      expect(result).toContain("<blockquote>");
      expect(result).toContain("<ul>");
      expect(result).toContain("<ol>");
      expect(result).toContain("見出し");
      expect(result).toContain("太字");
      expect(result).toContain("リンク");
      expect(result).toContain("引用");
      expect(result).toContain("箇条書き");
      expect(result).toContain("番号");
    });
  });

  describe("TC-010: invalid content", () => {
    it("returns null for unknown node type", () => {
      const content = { type: "unknown" } as unknown as PostContent;
      const result = toSanitizableHtml(content);
      expect(result).toBeNull();
    });

    it("returns null for null input", () => {
      const result = toSanitizableHtml(null as unknown as PostContent);
      expect(result).toBeNull();
    });

    it("does not throw for invalid content", () => {
      expect(() => toSanitizableHtml({ type: "unknown" } as unknown as PostContent)).not.toThrow();
    });
  });
});
