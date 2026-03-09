"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signInGoogle } from "@/lib/auth/client";
import type { AuthMode } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

const LOGIN_ERROR_MESSAGE =
  "ログインに失敗しました、サイト管理者にお問い合わせください";

type GoogleLoginButtonProps = Omit<ButtonProps, "onClick"> & {
  authMode: AuthMode;
  callbackUrl: string;
};

export default function GoogleLoginButton({
  authMode,
  callbackUrl,
  children = "Googleでログイン",
  ...buttonProps
}: GoogleLoginButtonProps) {
  const router = useRouter();

  const handleClick = async () => {
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
    <Button onClick={handleClick} type="button" {...buttonProps}>
      {children}
    </Button>
  );
}
