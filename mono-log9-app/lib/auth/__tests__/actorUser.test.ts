import {
  ensureActorUserFromSession,
  getActorUserIdFromSession,
  getGoogleSubFromSession,
} from "@/lib/auth/actorUser";
import { getPrismaClient } from "@/lib/db/prisma";

jest.mock("@/lib/db/prisma", () => ({
  getPrismaClient: jest.fn(),
}));

describe("actorUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws UNAUTHORIZED when googleSub is missing", async () => {
    expect(() => getGoogleSubFromSession(null)).toThrow("ログインが必要です");

    await expect(
      ensureActorUserFromSession({
        user: {
          name: "test",
          email: "test@example.com",
        },
        expires: "2099-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow("ログインが必要です");
  });

  it("reads actorUserId from session", () => {
    expect(
      getActorUserIdFromSession({
        user: {
          actorUserId: "user-abc",
        },
        expires: "2099-01-01T00:00:00.000Z",
      })
    ).toBe("user-abc");
  });

  it("uses session actorUserId without DB access", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "user-001" });
    (getPrismaClient as jest.Mock).mockResolvedValue({
      user: { upsert },
    });

    const actorUserId = await ensureActorUserFromSession({
      user: {
        googleSub: "google-sub-1",
        actorUserId: "user-from-session",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    expect(actorUserId).toBe("user-from-session");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts user by googleSub and returns actor user id", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "user-001" });
    (getPrismaClient as jest.Mock).mockResolvedValue({
      user: { upsert },
    });

    const actorUserId = await ensureActorUserFromSession({
      user: {
        googleSub: "google-sub-1",
        email: "updated@example.com",
        name: "Updated Name",
        image: "https://example.com/avatar.png",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    expect(actorUserId).toBe("user-001");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { googleSub: "google-sub-1" },
        select: { id: true },
      })
    );
  });

  it("does not overwrite existing fields with null values", async () => {
    const upsert = jest.fn().mockResolvedValue({ id: "user-002" });
    (getPrismaClient as jest.Mock).mockResolvedValue({
      user: { upsert },
    });

    await ensureActorUserFromSession({
      user: {
        googleSub: "google-sub-2",
        email: null,
        name: "Name Only",
        image: null,
      },
      expires: "2099-01-01T00:00:00.000Z",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          name: "Name Only",
        },
      })
    );
  });
});
