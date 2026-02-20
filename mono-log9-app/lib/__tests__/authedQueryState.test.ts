import {
  buildQueryForFavoriteToggle,
  buildQueryForNoteComposerClose,
  buildQueryForNoteComposerOpen,
  buildQueryForViewChange,
  normalizeAuthedQuery,
} from "@/lib/authedQueryState";

describe("authedQueryState", () => {
  describe("normalizeAuthedQuery", () => {
    it("normalizes empty query to view=memo", () => {
      const result = normalizeAuthedQuery("");

      expect(result.state).toEqual({
        view: "memo",
        activeMode: "memo",
        favoriteMemo: false,
        favoriteNote: false,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe("view=memo");
      expect(result.changed).toBe(true);
    });

    it("falls back invalid view to memo", () => {
      const result = normalizeAuthedQuery("view=invalid");

      expect(result.state.view).toBe("memo");
      expect(result.state.activeMode).toBe("memo");
      expect(result.nextQuery).toBe("view=memo");
      expect(result.changed).toBe(true);
    });

    it("uses first view when duplicated", () => {
      const result = normalizeAuthedQuery("view=note&view=memo");

      expect(result.state.view).toBe("note");
      expect(result.nextQuery).toBe("view=note");
      expect(result.changed).toBe(true);
    });

    it("deduplicates favorite keys", () => {
      const result = normalizeAuthedQuery("view=note&favoriteNote&favoriteNote=");

      expect(result.state.favoriteNote).toBe(true);
      expect(result.nextQuery).toBe("view=note&favoriteNote=");
      expect(result.changed).toBe(true);
    });

    it("drops invalid noteComposer and normalizes query", () => {
      const result = normalizeAuthedQuery("view=note&noteComposer=invalid");

      expect(result.state.noteComposer).toEqual({ mode: "none" });
      expect(result.nextQuery).toBe("view=note");
      expect(result.changed).toBe(true);
    });

    it("drops noteComposer when view is not note", () => {
      const result = normalizeAuthedQuery("view=memo&noteComposer=create");

      expect(result.state.noteComposer).toEqual({ mode: "none" });
      expect(result.nextQuery).toBe("view=memo");
      expect(result.changed).toBe(true);
    });

    it("keeps unknown query keys", () => {
      const result = normalizeAuthedQuery("stubAuth=1&foo=bar");

      expect(result.state.view).toBe("memo");
      expect(result.nextQuery).toBe("stubAuth=1&foo=bar&view=memo");
      expect(result.changed).toBe(true);
    });

    it("does not mark changed for already-valid query with non-canonical key order", () => {
      const result = normalizeAuthedQuery("view=note&stubAuth=1&favoriteNote");

      expect(result.state).toEqual({
        view: "note",
        activeMode: "note",
        favoriteMemo: false,
        favoriteNote: true,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe("view=note&stubAuth=1&favoriteNote");
      expect(result.changed).toBe(false);
    });
  });

  describe("buildQueryForViewChange", () => {
    it("updates only view and keeps favorite keys and unknown keys", () => {
      const result = buildQueryForViewChange(
        "stubAuth=1&foo=bar&view=memo&favoriteMemo",
        "note"
      );

      expect(result.state).toEqual({
        view: "note",
        activeMode: "note",
        favoriteMemo: true,
        favoriteNote: false,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe("stubAuth=1&foo=bar&view=note&favoriteMemo=");
      expect(result.changed).toBe(true);
    });

    it("clears noteComposer when moving from note to memo", () => {
      const result = buildQueryForViewChange("view=note&noteComposer=create", "memo");

      expect(result.state.view).toBe("memo");
      expect(result.state.noteComposer).toEqual({ mode: "none" });
      expect(result.nextQuery).toBe("view=memo");
      expect(result.changed).toBe(true);
    });

    it("returns changed=false on no-op", () => {
      const result = buildQueryForViewChange("view=note&favoriteNote", "note");

      expect(result.changed).toBe(false);
      expect(result.nextQuery).toBe("view=note&favoriteNote");
      expect(result.state.view).toBe("note");
    });
  });

  describe("buildQueryForFavoriteToggle", () => {
    it("toggles favoriteMemo in memo view and keeps favoriteNote", () => {
      const result = buildQueryForFavoriteToggle(
        "stubAuth=1&view=memo&favoriteNote&foo=bar"
      );

      expect(result.state).toEqual({
        view: "memo",
        activeMode: "memo",
        favoriteMemo: true,
        favoriteNote: true,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe(
        "stubAuth=1&foo=bar&view=memo&favoriteMemo=&favoriteNote="
      );
      expect(result.changed).toBe(true);
    });

    it("toggles favoriteNote in note view and keeps favoriteMemo", () => {
      const result = buildQueryForFavoriteToggle("view=note&favoriteMemo&favoriteNote");

      expect(result.state).toEqual({
        view: "note",
        activeMode: "note",
        favoriteMemo: true,
        favoriteNote: false,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe("view=note&favoriteMemo=");
      expect(result.changed).toBe(true);
    });

    it("returns changed=false in trash view", () => {
      const result = buildQueryForFavoriteToggle("view=trash&favoriteMemo");

      expect(result.changed).toBe(false);
      expect(result.state).toEqual({
        view: "trash",
        activeMode: null,
        favoriteMemo: true,
        favoriteNote: false,
        noteComposer: { mode: "none" },
      });
      expect(result.nextQuery).toBe("view=trash&favoriteMemo");
    });
  });

  describe("noteComposer query builders", () => {
    it("opens note composer in create mode", () => {
      const result = buildQueryForNoteComposerOpen("view=note&favoriteNote", {
        mode: "create",
      });

      expect(result.state.noteComposer).toEqual({ mode: "create" });
      expect(result.nextQuery).toBe("view=note&favoriteNote=&noteComposer=create");
      expect(result.changed).toBe(true);
    });

    it("opens note composer in edit mode", () => {
      const result = buildQueryForNoteComposerOpen("view=note", {
        mode: "edit",
        postId: "post-002",
      });

      expect(result.state.noteComposer).toEqual({ mode: "edit", postId: "post-002" });
      expect(result.nextQuery).toBe("view=note&noteComposer=edit%3Apost-002");
      expect(result.changed).toBe(true);
    });

    it("returns no-op when open is requested outside note view", () => {
      const result = buildQueryForNoteComposerOpen("view=memo", {
        mode: "create",
      });

      expect(result.changed).toBe(false);
      expect(result.nextQuery).toBe("view=memo");
      expect(result.state.noteComposer).toEqual({ mode: "none" });
    });

    it("closes note composer", () => {
      const result = buildQueryForNoteComposerClose("view=note&noteComposer=create");

      expect(result.state.noteComposer).toEqual({ mode: "none" });
      expect(result.nextQuery).toBe("view=note");
      expect(result.changed).toBe(true);
    });

    it("returns no-op when composer is already closed", () => {
      const result = buildQueryForNoteComposerClose("view=note");

      expect(result.changed).toBe(false);
      expect(result.nextQuery).toBe("view=note");
      expect(result.state.noteComposer).toEqual({ mode: "none" });
    });
  });
});
