import { decodePostsCursor, encodePostsCursor, parseCursorInput } from "@/lib/posts/cursor";

function rawCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

describe("posts cursor helpers", () => {
  it("encodes and decodes cursor payload", () => {
    const encoded = encodePostsCursor({
      v: 1,
      t: "2026-02-23T10:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(
      decodePostsCursor(encoded)
    ).toEqual({
      v: 1,
      t: "2026-02-23T10:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("parses none and v1 cursor shapes", () => {
    expect(parseCursorInput(undefined)).toEqual({
      kind: "none",
    });

    const encoded = encodePostsCursor({
      v: 1,
      t: "2026-02-23T10:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(parseCursorInput(encoded)).toEqual({
      kind: "v1",
      t: "2026-02-23T10:00:00.000Z",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("throws INVALID_CURSOR for malformed cursor", () => {
    expect(() => decodePostsCursor("")).toThrow("cursor is invalid");
    expect(() => parseCursorInput("   ")).toThrow("cursor is invalid");
    expect(() => parseCursorInput("post-001")).toThrow("cursor is invalid");
    expect(() => parseCursorInput("invalid-cursor")).toThrow("cursor is invalid");
    expect(() => parseCursorInput(Buffer.from("{", "utf8").toString("base64url"))).toThrow(
      "cursor is invalid"
    );
    expect(() => parseCursorInput(rawCursor({ v: 1, id: "550e8400-e29b-41d4-a716-446655440000" })))
      .toThrow("cursor is invalid");
    expect(() => parseCursorInput(rawCursor({ v: 1, t: "2026-02-23T10:00:00.000Z" }))).toThrow(
      "cursor is invalid"
    );
    expect(() =>
      parseCursorInput(rawCursor({ t: "2026-02-23T10:00:00.000Z", id: "550e8400-e29b-41d4-a716-446655440000" }))
    ).toThrow("cursor is invalid");
    expect(() =>
      parseCursorInput(
        rawCursor({
          v: 2,
          t: "2026-02-23T10:00:00.000Z",
          id: "550e8400-e29b-41d4-a716-446655440000",
        })
      )
    ).toThrow("cursor is invalid");
    expect(() =>
      parseCursorInput(
        encodePostsCursor({
          v: 1,
          t: "2026-02-23 10:00",
          id: "550e8400-e29b-41d4-a716-446655440000",
        })
      )
    ).toThrow("cursor is invalid");
    expect(() =>
      parseCursorInput(
        encodePostsCursor({
          v: 1,
          t: "2026-02-23T10:00:00.000Z",
          id: "post-001",
        })
      )
    ).toThrow("cursor is invalid");
    expect(() =>
      parseCursorInput(
        rawCursor({
          v: 1,
          t: "2026-02-23T10:00:00.000Z",
        })
      )
    ).toThrow("cursor is invalid");
  });
});
