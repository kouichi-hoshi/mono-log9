"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LOGIN_ERROR_MESSAGE =
  "ログインに失敗しました、サイト管理者にお問い合わせください";

type ControlledLoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stubAuthEnabled: boolean;
  loginUrl: string;
};

export default function ControlledLoginDialog({
  open,
  onOpenChange,
  stubAuthEnabled,
  loginUrl,
}: ControlledLoginDialogProps) {
  const router = useRouter();

  const handleGoogleLogin = () => {
    if (stubAuthEnabled) {
      onOpenChange(false);
      router.push(loginUrl);
      return;
    }

    toast.error(LOGIN_ERROR_MESSAGE);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
