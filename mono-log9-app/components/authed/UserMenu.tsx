"use client";

import { LogOut, UserCircle2 } from "lucide-react";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type UserMenuProps = {
  user: {
    name: string;
    handle: string;
    avatarFallback: string;
  };
};

export default function UserMenu({ user }: UserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-sm font-semibold"
          aria-label="ユーザーメニューを開く"
        >
          <span className="sr-only">{user.name}</span>
          {user.avatarFallback}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-foreground/60">@{user.handle}</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  スタブ認証のため、実際にはログアウトしません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>やめる</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => notifyNotImplemented("ログアウト")}
                >
                  ログアウトする
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
