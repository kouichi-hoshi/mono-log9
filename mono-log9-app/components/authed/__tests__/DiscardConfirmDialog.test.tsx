import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscardConfirmDialog from "@/components/authed/DiscardConfirmDialog";

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

describe("DiscardConfirmDialog", () => {
  it("renders discard confirmation texts when open", () => {
    render(<DiscardConfirmDialog open onOpenChange={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.getByText("編集中の内容があります。破棄して続行しますか？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "編集を続ける" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "破棄して続行" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<DiscardConfirmDialog open={false} onOpenChange={jest.fn()} onConfirm={jest.fn()} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    render(<DiscardConfirmDialog open onOpenChange={onOpenChange} onConfirm={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    render(<DiscardConfirmDialog open onOpenChange={jest.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "破棄して続行" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
