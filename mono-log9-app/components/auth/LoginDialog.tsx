"use client";

/**
 * モーダル形式のログインUI。
 * 現状は未使用（UnauthScreen では GoogleLoginButton を使用）。
 * 複数 SSO（Google / GitHub など）やメールログインを並列で組み込む場合は、
 * このコンポーネントを再利用する想定。
 */

import * as React from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";

const LOGIN_ERROR_MESSAGE =
  "ログインに失敗しました、サイト管理者にお問い合わせください";

type LoginDialogProps = {
  authMode: AuthMode;
  callbackUrl: string;
  triggerLabel?: string;
};

export default function LoginDialog({
  authMode,
  callbackUrl,
  triggerLabel = "ログイン",
}: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setOpen(false);

    if (authMode === "stub") {
      router.push(callbackUrl);
      return;
    }

    try {
      await signInGoogle(callbackUrl);
    } catch {
      toast.error(LOGIN_ERROR_MESSAGE);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
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
