import { PostRepositoryError } from "@/lib/posts/errors";

type CursorPayloadV1 = {
  v: 1;
  t: string;
  id: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function throwInvalidCursor(): never {
  throw new PostRepositoryError("INVALID_CURSOR", "cursor is invalid");
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function isStrictIsoUtc(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return false;
  }
  return new Date(time).toISOString() === value;
}

export function encodePostsCursor(payload: CursorPayloadV1): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodePostsCursor(cursor: string): CursorPayloadV1 {
  if (cursor.trim().length === 0) {
    throwInvalidCursor();
  }

  try {
    const decoded = JSON.parse(fromBase64Url(cursor)) as Partial<CursorPayloadV1>;
    if (
      decoded.v !== 1 ||
      typeof decoded.t !== "string" ||
      decoded.t.trim().length === 0 ||
      typeof decoded.id !== "string" ||
      decoded.id.trim().length === 0
    ) {
      throwInvalidCursor();
    }

    if (!isStrictIsoUtc(decoded.t)) {
      throwInvalidCursor();
    }

    if (!UUID_PATTERN.test(decoded.id)) {
      throwInvalidCursor();
    }

    return {
      v: 1,
      t: decoded.t,
      id: decoded.id,
    };
  } catch {
    throwInvalidCursor();
  }
}

export function parseCursorInput(
  cursor: string | undefined
): { kind: "none" } | { kind: "v1"; t: string; id: string } {
  if (typeof cursor === "undefined") {
    return { kind: "none" };
  }

  if (cursor.trim().length === 0) {
    throwInvalidCursor();
  }

  const decoded = decodePostsCursor(cursor);
  return {
    kind: "v1",
    t: decoded.t,
    id: decoded.id,
  };
}
