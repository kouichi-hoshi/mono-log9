import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TrashDeleteDialog from "@/components/authed/TrashDeleteDialog";

jest.mock("@/components/ui/alert-dialog", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const AlertDialogContext = React.createContext<{
    open: boolean;
    setOpen: (nextOpen: boolean) => void;
  } | null>(null);

  const useAlertDialogContext = () => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      return {
        open: true,
        setOpen: () => {},
      };
    }
    return context;
  };

  const AlertDialog = ({
    open,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = typeof open === "boolean";
    const currentOpen = isControlled ? open : internalOpen;
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };
    return (
      <AlertDialogContext.Provider value={{ open: currentOpen, setOpen }}>
        {children}
      </AlertDialogContext.Provider>
    );
  };

  const AlertDialogContent = ({ children }: { children: React.ReactNode }) => {
    const { open } = useAlertDialogContext();
    if (!open) {
      return null;
    }
    return <div role="alertdialog">{children}</div>;
  };

  const AlertDialogAction = ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );

  const AlertDialogCancel = ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { setOpen } = useAlertDialogContext();
    return (
      <button
        type="button"
        onClick={(event) => {
          onClick?.(event);
          setOpen(false);
        }}
        {...props}
      >
        {children}
      </button>
    );
  };

  const AlertDialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const AlertDialogFooter = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  const AlertDialogTitle = ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  );
  const AlertDialogDescription = ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  );

  return {
    AlertDialog,
    AlertDialogContent,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
  };
});

describe("TrashDeleteDialog", () => {
  it("renders selected-delete title with selected count", () => {
    render(
      <TrashDeleteDialog
        open
        mode="selected"
        selectedCount={3}
        submitting={false}
        errorMessage={null}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByText("3件の投稿を完全に削除しますか?")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません")).toBeInTheDocument();
  });

  it("renders empty-trash title for all mode", () => {
    render(
      <TrashDeleteDialog
        open
        mode="all"
        selectedCount={0}
        submitting={false}
        errorMessage={null}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByText("ごみ箱内のすべての投稿を完全に削除しますか?")).toBeInTheDocument();
  });

  it("renders error message when provided", () => {
    render(
      <TrashDeleteDialog
        open
        mode="selected"
        selectedCount={1}
        submitting={false}
        errorMessage="削除に失敗しました"
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByText("削除に失敗しました")).toBeInTheDocument();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    render(
      <TrashDeleteDialog
        open
        mode="selected"
        selectedCount={1}
        submitting={false}
        errorMessage={null}
        onOpenChange={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(
      <TrashDeleteDialog
        open
        mode="selected"
        selectedCount={1}
        submitting={false}
        errorMessage={null}
        onOpenChange={onOpenChange}
        onConfirm={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables buttons and shows loading label while submitting", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const onConfirm = jest.fn();

    render(
      <TrashDeleteDialog
        open
        mode="selected"
        selectedCount={1}
        submitting
        errorMessage={null}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    const submitButton = screen.getByRole("button", { name: "削除中..." });
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();

    await user.click(cancelButton);
    await user.click(submitButton);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(
      <TrashDeleteDialog
        open={false}
        mode={null}
        selectedCount={0}
        submitting={false}
        errorMessage={null}
        onOpenChange={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
