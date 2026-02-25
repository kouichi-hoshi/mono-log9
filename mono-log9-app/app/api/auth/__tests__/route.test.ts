/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

jest.mock("@/auth", () => ({
  handlers: {
    GET: jest.fn().mockResolvedValue({ status: 200, ok: true }),
    POST: jest.fn().mockResolvedValue({ status: 200, ok: true }),
  },
}));

jest.mock("@/lib/env", () => ({
  isStubAuthMisconfigured: jest.fn(),
  STUB_AUTH_FORBIDDEN_CODE: "FORBIDDEN",
  STUB_AUTH_FORBIDDEN_MESSAGE: "stub auth is disabled in this environment",
}));

const isStubAuthMisconfigured = jest.requireMock("@/lib/env")
  .isStubAuthMisconfigured as jest.Mock;
const { handlers } = jest.requireMock("@/auth");

const mockRequest = new Request("http://localhost:3000/api/auth/session");
const mockContext = { params: Promise.resolve({ nextauth: ["session"] }) };

describe("Auth Route stub-auth guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("misconfigured", () => {
    beforeEach(() => {
      isStubAuthMisconfigured.mockReturnValue(true);
    });

    it("GET returns 403 and JSON contract", async () => {
      const res = await GET(mockRequest, mockContext);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "stub auth is disabled in this environment",
        },
      });
    });

    it("POST returns 403 and JSON contract", async () => {
      const res = await POST(mockRequest, mockContext);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "stub auth is disabled in this environment",
        },
      });
    });

    it("GET does not delegate to handlers", async () => {
      await GET(mockRequest, mockContext);
      expect(handlers.GET).not.toHaveBeenCalled();
    });

    it("POST does not delegate to handlers", async () => {
      await POST(mockRequest, mockContext);
      expect(handlers.POST).not.toHaveBeenCalled();
    });

    it("outputs warning log with required fields", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      await GET(mockRequest, mockContext);
      expect(warnSpy).toHaveBeenCalledWith(
        "[stub-auth-guard] blocked auth route due to misconfiguration",
        expect.objectContaining({
          environment: expect.any(String),
          isStubAuthMisconfigured: true,
          endpoint: "/api/auth/[...nextauth]",
          method: "GET",
        })
      );
      warnSpy.mockRestore();
    });
  });

  describe("not misconfigured", () => {
    beforeEach(() => {
      isStubAuthMisconfigured.mockReturnValue(false);
    });

    it("GET delegates to handlers and does not return 403", async () => {
      const res = await GET(mockRequest, mockContext);
      expect(res.status).not.toBe(403);
      expect(handlers.GET).toHaveBeenCalledWith(mockRequest, mockContext);
    });

    it("POST delegates to handlers and does not return 403", async () => {
      const res = await POST(mockRequest, mockContext);
      expect(res.status).not.toBe(403);
      expect(handlers.POST).toHaveBeenCalledWith(mockRequest, mockContext);
    });
  });
});
