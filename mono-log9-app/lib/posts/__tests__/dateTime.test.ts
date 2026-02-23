import {
  formatJstDateTime,
  parseDisplayJstDateTime,
  parseDisplayJstDateTimeToEpochMs,
} from "@/lib/posts/dateTime";

describe("dateTime helpers", () => {
  it("formats date as YYYY-MM-DD HH:mm in JST", () => {
    expect(formatJstDateTime(new Date("2026-02-23T10:34:56.000Z"))).toBe("2026-02-23 19:34");
  });

  it("parses display JST datetime into UTC Date", () => {
    const parsed = parseDisplayJstDateTime("2026-02-23 19:34");
    expect(parsed?.toISOString()).toBe("2026-02-23T10:34:00.000Z");
  });

  it("returns null for invalid display datetime", () => {
    expect(parseDisplayJstDateTime("2026-02-30 10:00")).toBeNull();
    expect(parseDisplayJstDateTime("invalid")).toBeNull();
    expect(parseDisplayJstDateTimeToEpochMs("invalid")).toBeNull();
  });
});
