import { signIn, signOut } from "next-auth/react";

import { signInGoogle, signOutToRoot } from "@/lib/auth/client";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("auth client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes prompt=select_account when signing in with google", async () => {
    (signIn as jest.Mock).mockResolvedValueOnce(undefined);

    await signInGoogle("/?view=note&favoriteNote");

    expect(signIn).toHaveBeenCalledWith(
      "google",
      { callbackUrl: "/?view=note&favoriteNote" },
      { prompt: "select_account" }
    );
  });

  it("signs out with redirect=false and returns signOut url", async () => {
    (signOut as jest.Mock).mockResolvedValueOnce({ url: "/?signedout=1" });

    await expect(signOutToRoot()).resolves.toBe("/?signedout=1");
    expect(signOut).toHaveBeenCalledWith({
      callbackUrl: "/",
      redirect: false,
    });
  });

  it("falls back to / when signOut does not return url", async () => {
    (signOut as jest.Mock).mockResolvedValueOnce({});

    await expect(signOutToRoot()).resolves.toBe("/");
  });
});
