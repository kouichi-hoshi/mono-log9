import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AboutAppDialog from "@/components/authed/AboutAppDialog";

describe("AboutAppDialog", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_APP_VERSION = "0.9.0";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("displays app name and version when open", () => {
    render(<AboutAppDialog open onOpenChange={jest.fn()} />);

    expect(screen.getByRole("dialog", { name: "このアプリについて" })).toBeInTheDocument();
    expect(screen.getByText("Mono Log（モノログ）")).toBeInTheDocument();
    expect(screen.getByText("v0.9.0")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<AboutAppDialog open={false} onOpenChange={jest.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(<AboutAppDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByLabelText("閉じる"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("displays fallback version when NEXT_PUBLIC_APP_VERSION is not set", () => {
    delete process.env.NEXT_PUBLIC_APP_VERSION;

    render(<AboutAppDialog open onOpenChange={jest.fn()} />);

    expect(screen.getByText("v0.0.0")).toBeInTheDocument();
  });
});
