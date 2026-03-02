/** @jest-environment node */

describe("sanitizeRichHtml (node environment)", () => {
  it("fails closed without throwing when window is unavailable", async () => {
    jest.resetModules();
    jest.doMock("dompurify", () => ({
      __esModule: true,
      default: {},
    }));

    try {
      await jest.isolateModulesAsync(async () => {
        const { sanitizeRichHtml } = await import("@/lib/sanitizeRichHtml");
        const html = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';

        expect(() => sanitizeRichHtml(html)).not.toThrow();
        expect(sanitizeRichHtml(html)).toBe("");
      });
    } finally {
      jest.dontMock("dompurify");
    }
  });
});
