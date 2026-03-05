import {
  applyDeletePostsMutation,
  applyFavoriteMutation,
  applyMoveToTrashMutation,
  applyRestoreFromTrashMutation,
  upsertForCurrentView,
  type CacheMutationContext,
} from "@/lib/posts/cacheMutations";
import type { PostRecord, PostView } from "@/lib/posts/types";

function createPost(input: {
  id: string;
  mode: "memo" | "note";
  favorite?: boolean;
  createdAt: string;
  createdAtEpochMs?: number;
  trashedAt?: string;
  trashedAtEpochMs?: number;
}): PostRecord {
  return {
    id: input.id,
    mode: input.mode,
    title: undefined,
    content: { type: "doc", content: [] },
    contentText: input.id,
    favorite: input.favorite ?? false,
    createdAt: input.createdAt,
    createdAtEpochMs: input.createdAtEpochMs,
    trashedAt: input.trashedAt,
    trashedAtEpochMs: input.trashedAtEpochMs,
  };
}

function createContext(input: {
  view: PostView;
  favoriteOnly: boolean;
  items: PostRecord[];
}): CacheMutationContext {
  return {
    condition: {
      view: input.view,
      favoriteOnly: input.favoriteOnly,
      actorScope: "stub",
    },
    items: input.items,
  };
}

describe("cacheMutations", () => {
  describe("upsertForCurrentView", () => {
    it("TC-F7-3-001: removes the post in trash view when updated post is not trashed", () => {
      const existing = createPost({
        id: "post-1",
        mode: "memo",
        createdAt: "2026-03-01 10:00",
        trashedAt: "2026-03-01 11:00",
      });
      const restored = createPost({
        id: "post-1",
        mode: "memo",
        createdAt: "2026-03-01 10:00",
      });

      const next = upsertForCurrentView(
        createContext({ view: "trash", favoriteOnly: false, items: [existing] }),
        restored
      );

      expect(next).toEqual([]);
    });

    it("TC-F7-3-002: excludes post when mode does not match current view", () => {
      const memo = createPost({
        id: "memo-1",
        mode: "memo",
        createdAt: "2026-03-01 10:00",
      });
      const updatedNote = createPost({
        id: "note-1",
        mode: "note",
        createdAt: "2026-03-01 10:01",
      });

      const next = upsertForCurrentView(
        createContext({ view: "memo", favoriteOnly: false, items: [memo] }),
        updatedNote
      );

      expect(next).toEqual([memo]);
    });

    it("TC-F7-3-003: excludes non-favorite post in favorite-only view", () => {
      const existing = createPost({
        id: "post-1",
        mode: "note",
        favorite: true,
        createdAt: "2026-03-01 10:00",
      });
      const updated = createPost({
        id: "post-1",
        mode: "note",
        favorite: false,
        createdAt: "2026-03-01 10:01",
      });

      const next = upsertForCurrentView(
        createContext({ view: "note", favoriteOnly: true, items: [existing] }),
        updated
      );

      expect(next).toEqual([]);
    });
  });

  describe("applyFavoriteMutation", () => {
    it("TC-F7-3-004: inserts post into favorite-only cache when toggled to favorite", () => {
      const updated = createPost({
        id: "post-1",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 10:01",
        createdAtEpochMs: 2,
      });
      const older = createPost({
        id: "post-2",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 10:00",
        createdAtEpochMs: 1,
      });

      const next = applyFavoriteMutation(
        createContext({ view: "memo", favoriteOnly: true, items: [older] }),
        updated
      );

      expect(next.map((post) => post.id)).toEqual(["post-1", "post-2"]);
    });
  });

  describe("applyMoveToTrashMutation", () => {
    it("TC-F7-3-005: removes moved post from normal view cache", () => {
      const items = [
        createPost({ id: "post-1", mode: "memo", createdAt: "2026-03-01 10:00" }),
        createPost({ id: "post-2", mode: "memo", createdAt: "2026-03-01 09:00" }),
      ];

      const next = applyMoveToTrashMutation(
        createContext({ view: "memo", favoriteOnly: false, items }),
        { postId: "post-1", movedPost: null }
      );

      expect(next.map((post) => post.id)).toEqual(["post-2"]);
    });

    it("TC-F7-3-006: inserts moved post into trash cache and sorts by trashedAt desc", () => {
      const newer = createPost({
        id: "post-2",
        mode: "memo",
        createdAt: "2026-03-01 09:00",
        trashedAt: "2026-03-01 11:00",
        trashedAtEpochMs: 2,
      });
      const moved = createPost({
        id: "post-1",
        mode: "memo",
        createdAt: "2026-03-01 10:00",
        trashedAt: "2026-03-01 12:00",
        trashedAtEpochMs: 3,
      });

      const next = applyMoveToTrashMutation(
        createContext({ view: "trash", favoriteOnly: false, items: [newer] }),
        { postId: "post-1", movedPost: moved }
      );

      expect(next.map((post) => post.id)).toEqual(["post-1", "post-2"]);
    });
  });

  describe("applyRestoreFromTrashMutation", () => {
    it("TC-F7-3-007: removes restored post from trash cache", () => {
      const items = [
        createPost({
          id: "post-1",
          mode: "memo",
          createdAt: "2026-03-01 10:00",
          trashedAt: "2026-03-01 11:00",
        }),
      ];

      const next = applyRestoreFromTrashMutation(
        createContext({ view: "trash", favoriteOnly: false, items }),
        { postId: "post-1", restoredPost: null }
      );

      expect(next).toEqual([]);
    });

    it("TC-F7-3-008: restores to matching non-trash cache when mode and favorite conditions are satisfied", () => {
      const existing = createPost({
        id: "post-2",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 09:00",
        createdAtEpochMs: 1,
      });
      const restored = createPost({
        id: "post-1",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 10:00",
        createdAtEpochMs: 2,
      });

      const next = applyRestoreFromTrashMutation(
        createContext({ view: "memo", favoriteOnly: true, items: [existing] }),
        { postId: "post-1", restoredPost: restored }
      );

      expect(next.map((post) => post.id)).toEqual(["post-1", "post-2"]);
    });

    it("TC-F7-3-009: does not restore into favorite-only cache when restored post is not favorite", () => {
      const existing = createPost({
        id: "post-2",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 09:00",
      });
      const restored = createPost({
        id: "post-1",
        mode: "memo",
        favorite: false,
        createdAt: "2026-03-01 10:00",
      });

      const next = applyRestoreFromTrashMutation(
        createContext({ view: "memo", favoriteOnly: true, items: [existing] }),
        { postId: "post-1", restoredPost: restored }
      );

      expect(next).toEqual([existing]);
    });
  });

  describe("applyDeletePostsMutation", () => {
    it("TC-F7-3-010: removes all matching ids from cache", () => {
      const keep = createPost({ id: "post-3", mode: "note", createdAt: "2026-03-01 08:00" });
      const next = applyDeletePostsMutation(
        createContext({
          view: "note",
          favoriteOnly: false,
          items: [
            createPost({ id: "post-1", mode: "note", createdAt: "2026-03-01 10:00" }),
            createPost({ id: "post-2", mode: "note", createdAt: "2026-03-01 09:00" }),
            keep,
          ],
        }),
        ["post-1", "post-2"]
      );

      expect(next).toEqual([keep]);
    });
  });

  describe("contracts", () => {
    it("TC-F7-3-011: does not mutate input items", () => {
      const first = createPost({
        id: "post-1",
        mode: "memo",
        favorite: false,
        createdAt: "2026-03-01 10:00",
      });
      const second = createPost({
        id: "post-2",
        mode: "memo",
        favorite: true,
        createdAt: "2026-03-01 09:00",
      });
      const items = [first, second];
      const before = items.map((post) => ({ ...post }));

      const next = applyFavoriteMutation(
        createContext({ view: "memo", favoriteOnly: true, items }),
        createPost({
          id: "post-1",
          mode: "memo",
          favorite: true,
          createdAt: "2026-03-01 10:01",
        })
      );

      expect(next).not.toBe(items);
      expect(items).toEqual(before);
      expect(items[0]).toBe(first);
      expect(items[1]).toBe(second);
    });

    it("TC-F7-3-012: treats trash view with favoriteOnly=true as normalized trash condition", () => {
      const trashItems = [
        createPost({
          id: "trash-1",
          mode: "memo",
          favorite: false,
          createdAt: "2026-03-01 10:00",
          trashedAt: "2026-03-01 11:00",
          trashedAtEpochMs: 1,
        }),
      ];
      const movedPost = createPost({
        id: "trash-2",
        mode: "note",
        favorite: true,
        createdAt: "2026-03-01 09:00",
        trashedAt: "2026-03-01 12:00",
        trashedAtEpochMs: 2,
      });

      const normalized = applyMoveToTrashMutation(
        createContext({ view: "trash", favoriteOnly: false, items: trashItems }),
        { postId: movedPost.id, movedPost }
      );
      const nonNormalizedInput = applyMoveToTrashMutation(
        createContext({ view: "trash", favoriteOnly: true, items: trashItems }),
        { postId: movedPost.id, movedPost }
      );

      expect(nonNormalizedInput).toEqual(normalized);
      expect(nonNormalizedInput.map((post) => post.id)).toEqual(["trash-2", "trash-1"]);
    });
  });
});
