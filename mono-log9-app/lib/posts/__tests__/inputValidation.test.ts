import { createDocFromPlainText } from "@/lib/posts/content";
import {
  normalizeListLimit,
  toValidatedListPostsInput,
  toValidatedUpdatePostDto,
  validatePostIdFormatByMode,
} from "@/lib/posts/inputValidation";

describe("inputValidation", () => {
  const postId = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts list limit values in the allowed range", () => {
    expect(normalizeListLimit(1)).toBe(1);
    expect(normalizeListLimit(10)).toBe(10);
    expect(normalizeListLimit(50)).toBe(50);
  });

  it("rejects list limit values outside 1..50", () => {
    expect(() => normalizeListLimit(0)).toThrow("入力内容に不備があります");
    expect(() => normalizeListLimit(51)).toThrow("入力内容に不備があります");
    expect(() => normalizeListLimit(1.5)).toThrow("入力内容に不備があります");
  });

  it("validates postId format by mode", () => {
    expect(validatePostIdFormatByMode(postId, "stub")).toBe(postId);
    expect(validatePostIdFormatByMode(postId, "db")).toBe(postId);

    expect(() => validatePostIdFormatByMode("post-001", "stub")).toThrow(
      "入力内容に不備があります"
    );
    expect(() => validatePostIdFormatByMode("post-001", "db")).toThrow(
      "入力内容に不備があります"
    );
    expect(() => validatePostIdFormatByMode("not-uuid", "db")).toThrow(
      "入力内容に不備があります"
    );
  });

  it("validates update postId in db mode", () => {
    expect(() =>
      toValidatedUpdatePostDto(
        {
          postId: "post-001",
          content: createDocFromPlainText("x"),
        },
        { postIdMode: "db" }
      )
    ).toThrow("入力内容に不備があります");
  });

  it("validates list posts input shape", () => {
    expect(
      toValidatedListPostsInput({
        view: "memo",
        favoriteOnly: false,
        limit: 10,
      })
    ).toEqual({
      view: "memo",
      favoriteOnly: false,
      limit: 10,
      cursor: undefined,
    });

    expect(() =>
      toValidatedListPostsInput({
        view: "memo",
        favoriteOnly: false,
        limit: 51,
      })
    ).toThrow("入力内容に不備があります");
  });
});
