"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AuthedUser } from "@/components/authed/stubs";

const USER_MENU_POPOVER_CONTENT_ID = "user-menu-popover-content";

type UserMenuProps = {
  user: AuthedUser;
  onLogout: () => Promise<void>;
  isLogoutSubmitting?: boolean;
};

export default function UserMenu({
  user,
  onLogout,
  isLogoutSubmitting = false,
}: UserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-foreground/20 bg-foreground/5 text-sm font-semibold transition-colors hover:bg-foreground/10 hover:border-foreground/30"
          aria-label="ユーザーメニュー"
          aria-controls={USER_MENU_POPOVER_CONTENT_ID}
        >
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt={user.name}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            user.name.slice(0, 1)
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent id={USER_MENU_POPOVER_CONTENT_ID} align="end" className="w-52">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-foreground/60">{user.handle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isLogoutSubmitting}
            onClick={() => {
              void onLogout();
            }}
          >
            ログアウト
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
