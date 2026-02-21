"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signInGoogle } from "@/lib/auth/client";
import type { AuthMode } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LOGIN_ERROR_MESSAGE =
  "ログインに失敗しました、サイト管理者にお問い合わせください";

type ControlledLoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authMode: AuthMode;
  callbackUrl: string;
  onBeforeAuthRedirect?: () => void;
};

export default function ControlledLoginDialog({
  open,
  onOpenChange,
  authMode,
  callbackUrl,
  onBeforeAuthRedirect,
}: ControlledLoginDialogProps) {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    onOpenChange(false);

    if (authMode === "stub") {
      router.push(callbackUrl);
      return;
    }

    try {
      onBeforeAuthRedirect?.();
    } catch {
      // Draft persistence failure must not block auth redirect.
    }

    try {
      await signInGoogle(callbackUrl);
    } catch {
      toast.error(LOGIN_ERROR_MESSAGE);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ログイン</DialogTitle>
          <DialogDescription className="sr-only">
            Google アカウントでログインします
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Button className="w-full" onClick={handleGoogleLogin}>
            Googleでログイン
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
