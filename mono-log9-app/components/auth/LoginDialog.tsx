"use client";

import * as React from "react";
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

export default function LoginDialog() {
  const [open, setOpen] = React.useState(false);

  const handleGoogleLogin = () => {
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
