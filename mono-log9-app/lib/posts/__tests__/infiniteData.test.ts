import { flattenInfiniteItems, rebuildInfiniteData, type PostsInfiniteData } from "@/lib/posts/infiniteData";
import { createDocFromPlainText } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";

function createPost(id: string, createdAt: string): PostRecord {
  return {
    id,
    mode: "memo",
    content: createDocFromPlainText(id),
    contentText: id,
    favorite: false,
    createdAt,
  };
}

describe("infiniteData helpers", () => {
  it("flattens pages", () => {
    const data: PostsInfiniteData = {
      pageParams: [undefined],
      pages: [
        {
          items: [createPost("post-001", "2026-02-18 10:00")],
          hasNext: false,
          nextCursor: null,
        },
      ],
    };

    expect(flattenInfiniteItems(data).map((post) => post.id)).toEqual(["post-001"]);
  });

  it("keeps all loaded items when tail page has hasNext=false", () => {
    const page1 = Array.from({ length: 10 }, (_, index) =>
      createPost(`post-${`${index + 1}`.padStart(3, "0")}`, `2026-02-18 10:${index}`)
    );
    const page2 = Array.from({ length: 10 }, (_, index) =>
      createPost(`post-${`${index + 11}`.padStart(3, "0")}`, `2026-02-18 11:${index}`)
    );

    const current: PostsInfiniteData = {
      pageParams: [undefined, "post-010"],
      pages: [
        { items: page1, hasNext: true, nextCursor: "post-010" },
        { items: page2, hasNext: false, nextCursor: null },
      ],
    };

    const prepended = createPost("post-new", "2026-02-18 12:00");
    const rebuilt = rebuildInfiniteData(current, [prepended, ...page1, ...page2]);

    expect(rebuilt.pages[0].items.map((post) => post.id)).toEqual([
      "post-new",
      "post-001",
      "post-002",
      "post-003",
      "post-004",
      "post-005",
      "post-006",
      "post-007",
      "post-008",
      "post-009",
    ]);
    expect(rebuilt.pages[1].items.map((post) => post.id)).toEqual([
      "post-010",
      "post-011",
      "post-012",
      "post-013",
      "post-014",
      "post-015",
      "post-016",
      "post-017",
      "post-018",
      "post-019",
      "post-020",
    ]);
  });

  it("keeps capacity when tail page has hasNext=true", () => {
    const page1 = Array.from({ length: 10 }, (_, index) =>
      createPost(`post-${`${index + 1}`.padStart(3, "0")}`, `2026-02-18 10:${index}`)
    );
    const page2 = Array.from({ length: 10 }, (_, index) =>
      createPost(`post-${`${index + 11}`.padStart(3, "0")}`, `2026-02-18 11:${index}`)
    );

    const current: PostsInfiniteData = {
      pageParams: [undefined, "post-010"],
      pages: [
        { items: page1, hasNext: true, nextCursor: "post-010" },
        { items: page2, hasNext: true, nextCursor: "post-020" },
      ],
    };

    const prepended = createPost("post-new", "2026-02-18 12:00");
    const rebuilt = rebuildInfiniteData(current, [prepended, ...page1, ...page2]);

    expect(rebuilt.pages[0].items.map((post) => post.id)).toEqual([
      "post-new",
      "post-001",
      "post-002",
      "post-003",
      "post-004",
      "post-005",
      "post-006",
      "post-007",
      "post-008",
      "post-009",
    ]);
    expect(rebuilt.pages[1].items.map((post) => post.id)).toEqual([
      "post-010",
      "post-011",
      "post-012",
      "post-013",
      "post-014",
      "post-015",
      "post-016",
      "post-017",
      "post-018",
      "post-019",
    ]);
  });
});
