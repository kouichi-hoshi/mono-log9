"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { StubUser } from "@/components/authed/stubs";

type UserMenuProps = {
  user: StubUser;
  logoutUrl: string;
};

export default function UserMenu({ user, logoutUrl }: UserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-2 py-1 text-xs font-medium text-foreground/80 hover:bg-foreground/5"
          type="button"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            {user.avatarFallback}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-foreground">
              {user.name}
            </span>
            <span className="block text-[11px] text-foreground/60">
              {user.handle}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-foreground/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-foreground/60">{user.role}</p>
          </div>
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("未実装です（プロフィール編集）")}
            >
              <User className="h-4 w-4" />
              プロフィール編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast("未実装です（設定）")}
            >
              <Settings className="h-4 w-4" />
              設定
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={logoutUrl}>
                <LogOut className="h-4 w-4" />
                ログアウト
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
