import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginDialog from "@/components/auth/LoginDialog";
import { signIn } from "next-auth/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("LoginDialog authjs integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls next-auth signIn with prompt=select_account", async () => {
    const user = userEvent.setup();
    (signIn as jest.Mock).mockResolvedValueOnce(undefined);

    render(<LoginDialog authMode="authjs" callbackUrl="/?view=memo" />);

    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await user.click(screen.getByRole("button", { name: "Googleでログイン" }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        "google",
        { callbackUrl: "/?view=memo" },
        { prompt: "select_account" }
      );
    });
  });
});
