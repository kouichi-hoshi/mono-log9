"use client";

import Link from "next/link";

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
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-foreground/5 text-sm font-semibold"
          aria-label="ユーザーメニュー"
        >
          {user.name.slice(0, 1)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-foreground/60">{user.handle}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={logoutUrl}>ログアウト</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
