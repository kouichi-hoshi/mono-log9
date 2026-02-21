import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ControlledLoginDialog from "@/components/auth/ControlledLoginDialog";
import { signIn } from "next-auth/react";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("ControlledLoginDialog authjs integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls next-auth signIn with prompt=select_account", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onBeforeAuthRedirect = jest.fn();
    (signIn as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <ControlledLoginDialog
        open
        onOpenChange={onOpenChange}
        authMode="authjs"
        callbackUrl="/?view=note&favoriteNote"
        onBeforeAuthRedirect={onBeforeAuthRedirect}
      />
    );

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onBeforeAuthRedirect).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith(
        "google",
        { callbackUrl: "/?view=note&favoriteNote" },
        { prompt: "select_account" }
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("still calls next-auth signIn when onBeforeAuthRedirect throws", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onBeforeAuthRedirect = jest.fn(() => {
      throw new Error("sessionStorage unavailable");
    });
    (signIn as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <ControlledLoginDialog
        open
        onOpenChange={onOpenChange}
        authMode="authjs"
        callbackUrl="/?view=memo"
        onBeforeAuthRedirect={onBeforeAuthRedirect}
      />
    );

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(onBeforeAuthRedirect).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith(
        "google",
        { callbackUrl: "/?view=memo" },
        { prompt: "select_account" }
      );
    });
  });
});
