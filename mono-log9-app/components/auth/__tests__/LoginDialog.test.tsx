import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginDialog from "@/components/auth/LoginDialog";
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

describe("LoginDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses stub login path when authMode is stub", async () => {
    const user = userEvent.setup();
    render(<LoginDialog authMode="stub" callbackUrl="/?stubAuth=1&view=memo" />);

    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    expect(pushMock).toHaveBeenCalledWith("/?stubAuth=1&view=memo");
    expect(signInGoogle).not.toHaveBeenCalled();
  });

  it("calls signInGoogle when authMode is authjs", async () => {
    const user = userEvent.setup();
    render(<LoginDialog authMode="authjs" callbackUrl="/?view=note&favoriteNote" />);

    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(signInGoogle).toHaveBeenCalledWith("/?view=note&favoriteNote");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows login error toast when authjs signIn fails", async () => {
    const user = userEvent.setup();
    (signInGoogle as jest.Mock).mockRejectedValueOnce(new Error("login failed"));

    render(<LoginDialog authMode="authjs" callbackUrl="/" />);

    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "ログインに失敗しました、サイト管理者にお問い合わせください"
      );
    });
  });
});
