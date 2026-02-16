import * as React from "react";

import Home from "@/app/page";
import { getStubAuthEnabled } from "@/lib/env";
import { isStubAuthed } from "@/lib/stubAuth";

jest.mock("@/lib/env", () => ({
  getStubAuthEnabled: jest.fn(),
}));

jest.mock("@/lib/stubAuth", () => ({
  buildUrlWithStubAuth: jest.fn(() => "/?stubAuth=1"),
  isStubAuthed: jest.fn(),
}));

describe("app/page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes fixed logoutUrl=/ to AuthedScreen when authed", async () => {
    (getStubAuthEnabled as jest.Mock).mockReturnValue(true);
    (isStubAuthed as jest.Mock).mockReturnValue(true);

    const element = await Home({
      searchParams: { stubAuth: "1", view: "note", foo: "bar" },
    });

    expect(React.isValidElement(element)).toBe(true);
    if (!React.isValidElement<{ logoutUrl?: string }>(element)) {
      throw new Error("Expected Home to return a React element.");
    }

    expect(element.props.logoutUrl).toBe("/");
  });
});
