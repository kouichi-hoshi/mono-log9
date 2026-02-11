"use client";

import ModeToggle from "@/components/authed/ModeToggle";
import UserMenu from "@/components/authed/UserMenu";
import type { StubUser, ViewMode } from "@/components/authed/stubs";

type Container1Props = {
  user: StubUser;
  mode: ViewMode;
  favoriteOnly: boolean;
  logoutUrl: string;
  onModeChange: (mode: ViewMode) => void;
  onFavoriteToggle: () => void;
};

export default function Container1({
  user,
  mode,
  favoriteOnly,
  logoutUrl,
  onModeChange,
  onFavoriteToggle,
}: Container1Props) {
  return (
    <section>
      <div className="flex flex-wrap items-start gap-3 md:items-center">
        <ModeToggle
          className="flex-1"
          mode={mode}
          favoriteOnly={favoriteOnly}
          onChange={onModeChange}
          onFavoriteToggle={onFavoriteToggle}
        />
        <UserMenu user={user} logoutUrl={logoutUrl} />
      </div>
    </section>
  );
}
