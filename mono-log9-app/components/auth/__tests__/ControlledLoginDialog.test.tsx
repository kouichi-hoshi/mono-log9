import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ControlledLoginDialog from "@/components/auth/ControlledLoginDialog";
import { signInGoogle } from "@/lib/auth/client";
import { toast } from "sonner";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("@/lib/auth/client", () => ({
  signInGoogle: jest.fn(),
}));

jest.mock("sonner", () => {
  const toast = Object.assign(jest.fn(), { error: jest.fn() });
  return { toast };
});

describe("ControlledLoginDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses stub login path when authMode is stub", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(
      <ControlledLoginDialog
        open
        onOpenChange={onOpenChange}
        authMode="stub"
        callbackUrl="/?stubAuth=1&view=note"
      />
    );

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(pushMock).toHaveBeenCalledWith("/?stubAuth=1&view=note");
    expect(signInGoogle).not.toHaveBeenCalled();
  });

  it("calls onBeforeAuthRedirect and signInGoogle when authMode is authjs", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onBeforeAuthRedirect = jest.fn();

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
      expect(signInGoogle).toHaveBeenCalledWith("/?view=memo");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows login error toast when authjs signIn fails", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    (signInGoogle as jest.Mock).mockRejectedValueOnce(new Error("login failed"));

    render(
      <ControlledLoginDialog
        open
        onOpenChange={onOpenChange}
        authMode="authjs"
        callbackUrl="/"
      />
    );

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "ログインに失敗しました、サイト管理者にお問い合わせください"
      );
    });
  });

  it("continues authjs sign in even when onBeforeAuthRedirect throws", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onBeforeAuthRedirect = jest.fn(() => {
      throw new Error("storage unavailable");
    });

    render(
      <ControlledLoginDialog
        open
        onOpenChange={onOpenChange}
        authMode="authjs"
        callbackUrl="/?view=note"
        onBeforeAuthRedirect={onBeforeAuthRedirect}
      />
    );

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(onBeforeAuthRedirect).toHaveBeenCalledTimes(1);
      expect(signInGoogle).toHaveBeenCalledWith("/?view=note");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
