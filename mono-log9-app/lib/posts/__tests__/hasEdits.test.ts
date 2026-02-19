import { createDocFromPlainText } from "@/lib/posts/content";
import { isMemoDirty, isNoteDirty } from "@/lib/posts/hasEdits";

describe("hasEdits helpers", () => {
  it("returns false when memo values are equal", () => {
    expect(isMemoDirty("same", "same")).toBe(false);
  });

  it("returns true when memo values are different", () => {
    expect(isMemoDirty("before", "after")).toBe(true);
  });

  it("returns false when note title/content are equal", () => {
    const doc = createDocFromPlainText("本文");
    expect(
      isNoteDirty(
        {
          title: "タイトル",
          content: doc,
        },
        {
          title: "タイトル",
          content: doc,
        }
      )
    ).toBe(false);
  });

  it("treats note title trim-only changes as not dirty", () => {
    const doc = createDocFromPlainText("本文");
    expect(
      isNoteDirty(
        {
          title: "  タイトル ",
          content: doc,
        },
        {
          title: "タイトル",
          content: doc,
        }
      )
    ).toBe(false);
  });

  it("treats null and empty doc as equivalent", () => {
    expect(
      isNoteDirty(
        {
          title: "",
          content: null,
        },
        {
          title: "",
          content: { type: "doc", content: [] },
        }
      )
    ).toBe(false);
  });

  it("treats null and empty paragraph doc as equivalent", () => {
    expect(
      isNoteDirty(
        {
          title: "",
          content: null,
        },
        {
          title: "",
          content: {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
        }
      )
    ).toBe(false);
  });

  it("returns true when note content changes", () => {
    expect(
      isNoteDirty(
        {
          title: "タイトル",
          content: createDocFromPlainText("before"),
        },
        {
          title: "タイトル",
          content: createDocFromPlainText("after"),
        }
      )
    ).toBe(true);
  });

  it("returns true when note title changes", () => {
    expect(
      isNoteDirty(
        {
          title: "before",
          content: createDocFromPlainText("本文"),
        },
        {
          title: "after",
          content: createDocFromPlainText("本文"),
        }
      )
    ).toBe(true);
  });
});
