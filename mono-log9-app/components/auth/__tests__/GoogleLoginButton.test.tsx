import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
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

describe("GoogleLoginButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses stub login path when authMode is stub", async () => {
    const user = userEvent.setup();
    render(<GoogleLoginButton authMode="stub" callbackUrl="/?stubAuth=1&view=memo" />);

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    expect(pushMock).toHaveBeenCalledWith("/?stubAuth=1&view=memo");
    expect(signInGoogle).not.toHaveBeenCalled();
  });

  it("calls signInGoogle when authMode is authjs", async () => {
    const user = userEvent.setup();
    render(<GoogleLoginButton authMode="authjs" callbackUrl="/?view=note&favoriteNote" />);

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(signInGoogle).toHaveBeenCalledWith("/?view=note&favoriteNote");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows login error toast when authjs signIn fails", async () => {
    const user = userEvent.setup();
    (signInGoogle as jest.Mock).mockRejectedValueOnce(new Error("login failed"));

    render(<GoogleLoginButton authMode="authjs" callbackUrl="/" />);

    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "ログインに失敗しました、サイト管理者にお問い合わせください"
      );
    });
  });

  it("renders custom label when children is provided", () => {
    render(
      <GoogleLoginButton authMode="stub" callbackUrl="/">
        カスタムラベル
      </GoogleLoginButton>
    );
    expect(screen.getByRole("button", { name: "カスタムラベル" })).toBeInTheDocument();
  });
});
