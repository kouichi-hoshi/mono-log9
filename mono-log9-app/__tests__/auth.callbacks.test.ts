/**
 * @jest-environment node
 */

jest.mock("@/lib/env", () => ({
  isStubAuthMisconfigured: jest.fn(() => false),
  createStubAuthForbiddenError: jest.fn(() => {
    const err = new Error("stub auth is disabled in this environment") as Error & { code: string };
    err.code = "FORBIDDEN";
    return err;
  }),
}));

jest.mock("@/lib/auth/actorUser", () => ({
  upsertActorUserByGoogleSub: jest.fn(),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn((config: unknown) => {
    (globalThis as { __authTestCapturedConfig?: unknown }).__authTestCapturedConfig = config;
    return {
      handlers: {},
      auth: jest.fn().mockResolvedValue({ user: { id: "1" } }),
      signIn: jest.fn(),
      signOut: jest.fn(),
    };
  }),
}));

import "@/auth";
import { upsertActorUserByGoogleSub } from "@/lib/auth/actorUser";

function getCallbacks() {
  const capturedConfig = (globalThis as {
    __authTestCapturedConfig?: { callbacks?: Record<string, (...args: unknown[]) => unknown> };
  }).__authTestCapturedConfig;
  if (!capturedConfig?.callbacks) {
    throw new Error("callbacks not captured");
  }
  return capturedConfig.callbacks as {
    jwt: (args: {
      token: Record<string, unknown>;
      account?: { provider?: string; providerAccountId?: string };
      profile?: { sub?: string };
    }) => Promise<Record<string, unknown>>;
    session: (args: {
      session: { user?: Record<string, unknown> };
      token: Record<string, unknown>;
    }) => Promise<{ user?: Record<string, unknown> }>;
  };
}

describe("auth callbacks", () => {
  const upsertActorUserByGoogleSubMock = jest.mocked(upsertActorUserByGoogleSub);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets googleSub and actorUserId in jwt callback", async () => {
    upsertActorUserByGoogleSubMock.mockResolvedValue("user-001");
    const callbacks = getCallbacks();

    const result = await callbacks.jwt({
      token: {
        email: "user@example.com",
        name: "User",
        picture: "https://example.com/avatar.png",
      },
      account: {
        provider: "google",
        providerAccountId: "google-sub-1",
      },
      profile: {},
    });

    expect(result.googleSub).toBe("google-sub-1");
    expect(result.actorUserId).toBe("user-001");
    expect(upsertActorUserByGoogleSubMock).toHaveBeenCalledWith({
      googleSub: "google-sub-1",
      email: "user@example.com",
      name: "User",
      image: "https://example.com/avatar.png",
    });
  });

  it("skips upsert when actorUserId already exists", async () => {
    const callbacks = getCallbacks();
    const result = await callbacks.jwt({
      token: {
        googleSub: "google-sub-1",
        actorUserId: "user-existing",
      },
    });

    expect(result.actorUserId).toBe("user-existing");
    expect(upsertActorUserByGoogleSubMock).not.toHaveBeenCalled();
  });

  it("refreshes actorUserId when googleSub changes", async () => {
    upsertActorUserByGoogleSubMock.mockResolvedValue("user-new");
    const callbacks = getCallbacks();
    const result = await callbacks.jwt({
      token: {
        googleSub: "google-sub-old",
        actorUserId: "user-old",
      },
      account: {
        provider: "google",
        providerAccountId: "google-sub-new",
      },
      profile: {},
    });

    expect(result.googleSub).toBe("google-sub-new");
    expect(result.actorUserId).toBe("user-new");
    expect(upsertActorUserByGoogleSubMock).toHaveBeenCalledWith({
      googleSub: "google-sub-new",
      email: null,
      name: null,
      image: null,
    });
  });

  it("does not throw when actor upsert fails in jwt callback", async () => {
    upsertActorUserByGoogleSubMock.mockRejectedValue(new Error("db error"));
    const callbacks = getCallbacks();

    const result = await callbacks.jwt({
      token: {
        googleSub: "google-sub-2",
      },
    });

    expect(result.googleSub).toBe("google-sub-2");
    expect(result.actorUserId).toBeUndefined();
    expect(upsertActorUserByGoogleSubMock).toHaveBeenCalledTimes(1);
    expect(upsertActorUserByGoogleSubMock).toHaveBeenCalledWith({
      googleSub: "google-sub-2",
      email: null,
      name: null,
      image: null,
    });
  });

  it("maps token actor fields into session", async () => {
    const callbacks = getCallbacks();
    const result = await callbacks.session({
      session: {
        user: {
          name: "User",
        },
      },
      token: {
        googleSub: "google-sub-1",
        actorUserId: "user-001",
      },
    });

    expect(result.user?.googleSub).toBe("google-sub-1");
    expect(result.user?.actorUserId).toBe("user-001");
  });
});
