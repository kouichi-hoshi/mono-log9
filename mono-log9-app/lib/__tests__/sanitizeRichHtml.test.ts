import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

describe("sanitizeRichHtml", () => {
  it("keeps allowed tags and removes forbidden tags", () => {
    const html = "<h2>見出し</h2><p>本文<script>alert(1)</script></p><img src=x />";

    const sanitized = sanitizeRichHtml(html);
    const doc = new DOMParser().parseFromString(sanitized, "text/html");

    expect(doc.querySelector("h2")?.textContent).toBe("見出し");
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.querySelector("img")).toBeNull();
  });

  it("removes dangerous href and adds rel/target for safe links", () => {
    const html = [
      '<p><a href="javascript:alert(1)">bad</a></p>',
      '<p><a href="https://example.com">good</a></p>',
    ].join("");

    const sanitized = sanitizeRichHtml(html);
    const doc = new DOMParser().parseFromString(sanitized, "text/html");
    const links = Array.from(doc.querySelectorAll("a"));

    expect(links[0]?.getAttribute("href")).toBeNull();
    expect(links[0]?.getAttribute("target")).toBeNull();
    expect(links[1]?.getAttribute("href")).toBe("https://example.com");
    expect(links[1]?.getAttribute("target")).toBe("_blank");
    expect(links[1]?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
