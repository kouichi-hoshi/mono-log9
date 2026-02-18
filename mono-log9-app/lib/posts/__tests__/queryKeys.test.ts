import { normalizePostsListCondition, postsListQueryKey } from "@/lib/posts/queryKeys";

describe("posts query keys", () => {
  it("normalizes favoriteOnly=false in trash view", () => {
    expect(
      normalizePostsListCondition({
        view: "trash",
        favoriteOnly: true,
      })
    ).toEqual({
      view: "trash",
      favoriteOnly: false,
    });
  });

  it("separates query keys by view", () => {
    const memo = postsListQueryKey({ view: "memo", favoriteOnly: false });
    const note = postsListQueryKey({ view: "note", favoriteOnly: false });

    expect(memo).not.toEqual(note);
  });

  it("separates query keys by favoriteOnly", () => {
    const normal = postsListQueryKey({ view: "memo", favoriteOnly: false });
    const favorite = postsListQueryKey({ view: "memo", favoriteOnly: true });

    expect(normal).not.toEqual(favorite);
  });
});
