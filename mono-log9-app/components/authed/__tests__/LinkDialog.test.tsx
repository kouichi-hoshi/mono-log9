import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LinkDialog from "@/components/authed/LinkDialog";

describe("LinkDialog", () => {
  it("shows validation message when URL is empty", async () => {
    const user = userEvent.setup();

    render(
      <LinkDialog
        open
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "適用" }));

    expect(screen.getByText("URLを入力してください")).toBeInTheDocument();
  });

  it("normalizes url with https when protocol is omitted", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <LinkDialog
        open
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText("リンクURL"), "example.com");
    await user.click(screen.getByRole("button", { name: "適用" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toBe("https://example.com/");
  });
});
