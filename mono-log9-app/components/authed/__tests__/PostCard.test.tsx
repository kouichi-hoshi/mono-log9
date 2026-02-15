import { render, screen, within } from "@testing-library/react";

import PostCard from "@/components/authed/PostCard";
import type { StubPost } from "@/components/authed/stubs";

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

describe("PostCard", () => {
  it("renders sanitized html for note body", () => {
    const post: StubPost = {
      id: "note-001",
      mode: "note",
      content:
        '<h2>見出し</h2><ul><li><strong>項目</strong></li></ul><p><a href="https://example.com">参考</a></p><script>alert(1)</script>',
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
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
    const post: StubPost = {
      id: "note-002",
      mode: "note",
      title: "ノートタイトル",
      content: "<h2>本文見出し</h2>",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByText("ノートタイトル")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "本文見出し" })).not.toBeInTheDocument();
  });

  it("falls back to plain text rendering for non-html note content", () => {
    const post: StubPost = {
      id: "note-003",
      mode: "note",
      content: "## 見出し\n- 箇条書き1\n- 箇条書き2",
      createdAt: "2026-02-15 12:00",
      favorite: false,
    };

    render(
      <PostCard
        post={post}
        onToggleFavorite={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    const content = screen.getByTestId("post-content");

    expect(content).toHaveTextContent("## 見出し");
    expect(content).toHaveTextContent("箇条書き1");
    expect(content).toHaveTextContent("箇条書き2");
    expect(content.querySelector(".md-content")).toBeNull();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });
});
