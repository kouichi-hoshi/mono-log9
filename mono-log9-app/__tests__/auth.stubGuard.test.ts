/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import {
  createStubAuthForbiddenError,
  isStubAuthMisconfigured,
  STUB_AUTH_FORBIDDEN_CODE,
  STUB_AUTH_FORBIDDEN_MESSAGE,
} from "@/lib/env";

jest.mock("next-auth/providers/google", () => ({ default: {} }));

jest.mock("@/lib/env", () => ({
  isStubAuthMisconfigured: jest.fn(),
  createStubAuthForbiddenError: jest.fn(() => {
    const err = new Error("stub auth is disabled in this environment") as Error & {
      code: string;
    };
    err.code = "FORBIDDEN";
    return err;
  }),
  STUB_AUTH_FORBIDDEN_CODE: "FORBIDDEN",
  STUB_AUTH_FORBIDDEN_MESSAGE: "stub auth is disabled in this environment",
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn().mockResolvedValue({ user: { id: "1" } }),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

const isStubAuthMisconfiguredMock = jest.mocked(isStubAuthMisconfigured);

describe("auth stub-adapter guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws FORBIDDEN when misconfigured", async () => {
    isStubAuthMisconfiguredMock.mockReturnValue(true);

    await expect(
      Promise.resolve().then(() => auth() as Promise<unknown>)
    ).rejects.toMatchObject({
      code: STUB_AUTH_FORBIDDEN_CODE,
      message: STUB_AUTH_FORBIDDEN_MESSAGE,
    });
    expect(createStubAuthForbiddenError).toHaveBeenCalled();
  });

  it("delegates to authImpl when not misconfigured", async () => {
    isStubAuthMisconfiguredMock.mockReturnValue(false);

    const result = await auth();
    expect(result).toEqual({ user: { id: "1" } });
    expect(createStubAuthForbiddenError).not.toHaveBeenCalled();
  });
});
