import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import UserMenu from "@/components/authed/UserMenu";

const mockUser = {
  name: "Test User",
  handle: "@test",
  imageUrl: null,
};

async function openUserMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("ユーザーメニュー"));
}

describe("UserMenu", () => {
  it("shows user name and logout button when popover is open", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={mockUser} onLogout={jest.fn()} />);

    await openUserMenu(user);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
  });

  it("shows このアプリについて button when popover is open", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={mockUser} onLogout={jest.fn()} />);

    await openUserMenu(user);

    expect(screen.getByRole("button", { name: "このアプリについて" })).toBeInTheDocument();
  });

  it("opens AboutAppDialog when このアプリについて is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={mockUser} onLogout={jest.fn()} />);

    await openUserMenu(user);
    await user.click(screen.getByRole("button", { name: "このアプリについて" }));

    expect(screen.getByRole("dialog", { name: "このアプリについて" })).toBeInTheDocument();
  });

  it("calls onLogout when ログアウト is clicked", async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn().mockResolvedValue(undefined);
    render(<UserMenu user={mockUser} onLogout={onLogout} />);

    await openUserMenu(user);
    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
