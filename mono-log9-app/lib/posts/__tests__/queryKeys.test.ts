import { normalizePostsListCondition, postsListQueryKey } from "@/lib/posts/queryKeys";

describe("posts query keys", () => {
  it("normalizes favoriteOnly=false in trash view", () => {
    expect(
      normalizePostsListCondition({
        view: "trash",
        favoriteOnly: true,
        actorScope: "stub",
      })
    ).toEqual({
      view: "trash",
      favoriteOnly: false,
      actorScope: "stub",
    });
  });

  it("separates query keys by view", () => {
    const memo = postsListQueryKey({ view: "memo", favoriteOnly: false, actorScope: "stub" });
    const note = postsListQueryKey({ view: "note", favoriteOnly: false, actorScope: "stub" });

    expect(memo).not.toEqual(note);
  });

  it("separates query keys by favoriteOnly", () => {
    const normal = postsListQueryKey({ view: "memo", favoriteOnly: false, actorScope: "stub" });
    const favorite = postsListQueryKey({ view: "memo", favoriteOnly: true, actorScope: "stub" });

    expect(normal).not.toEqual(favorite);
  });

  it("separates query keys by actor scope", () => {
    const actorA = postsListQueryKey({ view: "memo", favoriteOnly: false, actorScope: "actor:a" });
    const actorB = postsListQueryKey({ view: "memo", favoriteOnly: false, actorScope: "actor:b" });

    expect(actorA).not.toEqual(actorB);
  });
});
