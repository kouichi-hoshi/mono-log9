import * as React from "react";

import Home from "@/app/page";
import { auth } from "@/auth";
import { buildCallbackPathFromSearchParams } from "@/lib/auth/callbackUrl";
import { getStubAuthEnabled } from "@/lib/env";
import { buildUrlWithStubAuth, isStubAuthed } from "@/lib/stubAuth";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/env", () => ({
  getStubAuthEnabled: jest.fn(),
}));

jest.mock("@/lib/stubAuth", () => ({
  buildUrlWithStubAuth: jest.fn(() => "/?stubAuth=1"),
  isStubAuthed: jest.fn(),
}));

jest.mock("@/lib/auth/callbackUrl", () => ({
  buildCallbackPathFromSearchParams: jest.fn(() => "/?view=note"),
}));

jest.mock("@/lib/auth/client", () => ({
  signInGoogle: jest.fn(),
  signOutToRoot: jest.fn(),
}));

describe("app/page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders AuthedScreen in stub mode when stubAuth is active", async () => {
    (getStubAuthEnabled as jest.Mock).mockReturnValue(true);
    (isStubAuthed as jest.Mock).mockReturnValue(true);

    const element = await Home({
      searchParams: { stubAuth: "1", view: "note" },
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement<{ authMode?: string }>(element)) {
      throw new Error("Expected Home to return a React element.");
    }

    expect(element.props.authMode).toBe("stub");
    expect(auth).not.toHaveBeenCalled();
  });

  it("renders AuthedScreen in authjs mode when session exists", async () => {
    (getStubAuthEnabled as jest.Mock).mockReturnValue(false);
    (isStubAuthed as jest.Mock).mockReturnValue(false);
    (auth as jest.Mock).mockResolvedValue({
      user: {
        name: "Auth User",
        email: "auth-user@example.com",
        image: "https://example.com/avatar.png",
      },
    });

    const element = await Home({
      searchParams: { view: "memo" },
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement<{ authMode?: string; user?: { handle?: string } }>(element)) {
      throw new Error("Expected Home to return a React element.");
    }

    expect(element.props.authMode).toBe("authjs");
    expect(element.props.user?.handle).toBe("@auth-user");
  });

  it("renders UnauthScreen in authjs mode with callbackUrl", async () => {
    (getStubAuthEnabled as jest.Mock).mockReturnValue(false);
    (isStubAuthed as jest.Mock).mockReturnValue(false);
    (auth as jest.Mock).mockResolvedValue(null);

    const element = await Home({
      searchParams: { stubAuth: "1", view: "note" },
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement<{ authMode?: string; callbackUrl?: string }>(element)) {
      throw new Error("Expected Home to return a React element.");
    }

    expect(buildCallbackPathFromSearchParams).toHaveBeenCalledWith({
      stubAuth: "1",
      view: "note",
    });
    expect(element.props.authMode).toBe("authjs");
    expect(element.props.callbackUrl).toBe("/?view=note");
    expect(buildUrlWithStubAuth).not.toHaveBeenCalled();
  });

  it("renders UnauthScreen in stub mode with stub login url when stub is enabled but not authed", async () => {
    (getStubAuthEnabled as jest.Mock).mockReturnValue(true);
    (isStubAuthed as jest.Mock).mockReturnValue(false);

    const element = await Home({
      searchParams: { view: "memo" },
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement<{ authMode?: string; callbackUrl?: string }>(element)) {
      throw new Error("Expected Home to return a React element.");
    }

    expect(element.props.authMode).toBe("stub");
    expect(element.props.callbackUrl).toBe("/?stubAuth=1");
    expect(buildUrlWithStubAuth).toHaveBeenCalledWith({ view: "memo" });
  });
});
