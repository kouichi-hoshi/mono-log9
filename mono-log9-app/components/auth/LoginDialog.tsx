"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LOGIN_ERROR_MESSAGE =
  "ログインに失敗しました、サイト管理者にお問い合わせください";

type LoginDialogProps = {
  stubAuthEnabled: boolean;
  loginUrl: string;
};

export default function LoginDialog({
  stubAuthEnabled,
  loginUrl,
}: LoginDialogProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleGoogleLogin = () => {
    if (stubAuthEnabled) {
      setOpen(false);
      router.push(loginUrl);
      return;
    }

    toast.error(LOGIN_ERROR_MESSAGE);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">ログイン</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ログイン</DialogTitle>
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
