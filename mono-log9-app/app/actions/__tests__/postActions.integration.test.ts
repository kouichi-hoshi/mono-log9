import { createPostAction } from "@/app/actions/postActions";
import { __resetStubPostRepositoryForTests } from "@/lib/posts/repositories/stubPostRepository";

describe("postActions integration", () => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalStubPosts = process.env.USE_STUB_POSTS;

  beforeEach(() => {
    mutableEnv.NODE_ENV = "development";
    mutableEnv.USE_STUB_POSTS = "true";
    __resetStubPostRepositoryForTests();
  });

  afterAll(() => {
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.USE_STUB_POSTS = originalStubPosts;
  });

  it("creates note with heading + empty paragraph content", async () => {
    const result = await createPostAction({
      mode: "note",
      title: "E2E H2 Save",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "見出し付き本文" }],
          },
          { type: "paragraph" },
        ],
      },
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("creates note with blockquote content", async () => {
    const result = await createPostAction({
      mode: "note",
      title: "E2E Quote Save",
      content: {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "引用本文" }],
              },
            ],
          },
        ],
      },
    });

    expect(result).toMatchObject({ ok: true });
  });
});
