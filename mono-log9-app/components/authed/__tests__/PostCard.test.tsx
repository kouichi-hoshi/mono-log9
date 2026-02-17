import { render, screen, within } from "@testing-library/react";

import PostCard from "@/components/authed/PostCard";
import { createDocFromPlainText } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

jest.mock("@/lib/sanitizeRichHtml", () => {
  const actual = jest.requireActual("@/lib/sanitizeRichHtml");
  return {
    ...actual,
    sanitizeRichHtml: jest.fn(actual.sanitizeRichHtml),
  };
});

const actualSanitizeRichHtml = (
  jest.requireActual("@/lib/sanitizeRichHtml") as typeof import("@/lib/sanitizeRichHtml")
).sanitizeRichHtml;

const sanitizeRichHtmlMock = sanitizeRichHtml as jest.MockedFunction<typeof sanitizeRichHtml>;

describe("PostCard", () => {
  beforeEach(() => {
    sanitizeRichHtmlMock.mockReset();
    sanitizeRichHtmlMock.mockImplementation(actualSanitizeRichHtml);
  });

  it("renders sanitized html for note body", () => {
    const post: PostRecord = {
      id: "note-001",
      mode: "note",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "見出し" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "項目",
                        marks: [{ type: "bold" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "参考",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
        ],
      },
      contentText: "見出し\n\n項目\n参考",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
        onMoveToTrash={jest.fn()}
      />
    );

    const content = screen.getByTestId("post-content");

    expect(within(content).getByRole("heading", { level: 2, name: "見出し" })).toBeInTheDocument();
    expect(content.querySelector("ul")).not.toBeNull();
    expect(content.querySelector("strong")?.textContent).toBe("項目");

    const link = within(content).getByRole("link", { name: "参考" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(content.querySelector("script")).toBeNull();
  });

  it("prioritizes note title display when title exists", () => {
    const post: PostRecord = {
      id: "note-002",
      mode: "note",
      title: "ノートタイトル",
      content: createDocFromPlainText("本文見出し"),
      contentText: "本文見出し",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
        onMoveToTrash={jest.fn()}
      />
    );

    expect(screen.getByText("ノートタイトル")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "本文見出し" })).not.toBeInTheDocument();
  });

  it("falls back to plain text rendering for non-html note content", () => {
    const post: PostRecord = {
      id: "note-003",
      mode: "note",
      content: {
        type: "doc",
        content: [{ type: "unsupportedNodeType" }],
      },
      contentText: "見出し\n箇条書き1\n箇条書き2",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
        onMoveToTrash={jest.fn()}
      />
    );

    const content = screen.getByTestId("post-content");

    expect(content).toHaveTextContent("見出し");
    expect(content).toHaveTextContent("箇条書き1");
    expect(content).toHaveTextContent("箇条書き2");
    expect(content.querySelector(".md-content")).toBeNull();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("renders empty safe output when sanitizer returns empty string", () => {
    sanitizeRichHtmlMock.mockReturnValue("");
    const post: PostRecord = {
      id: "note-004",
      mode: "note",
      content: createDocFromPlainText("見出し"),
      contentText: "見出し",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
        onMoveToTrash={jest.fn()}
      />
    );

    const content = screen.getByTestId("post-content");
    expect(content).toHaveTextContent("見出し");
    expect(within(content).queryByRole("heading", { level: 2, name: "見出し" })).not.toBeInTheDocument();
  });
});
