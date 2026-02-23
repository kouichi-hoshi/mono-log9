import { formatUtcDateTime } from "@/lib/posts/dateTime";

describe("formatUtcDateTime", () => {
  it("formats date as YYYY-MM-DD HH:mm in UTC", () => {
    expect(formatUtcDateTime(new Date("2026-02-23T10:34:56.000Z"))).toBe("2026-02-23 10:34");
  });
});
