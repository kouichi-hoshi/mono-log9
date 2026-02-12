"use client";

import ModeToggle from "@/components/authed/ModeToggle";
import UserMenu from "@/components/authed/UserMenu";
import type { StubUser, ViewMode } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";

type Container1Props = {
  user: StubUser;
  mode: ViewMode;
  favoriteOnly: boolean;
  logoutUrl: string;
  onModeChange: (mode: ViewMode) => void;
  onFavoriteToggle: () => void;
  onNoteComposeClick: () => void;
};

export default function Container1({
  user,
  mode,
  favoriteOnly,
  logoutUrl,
  onModeChange,
  onFavoriteToggle,
  onNoteComposeClick,
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          aria-label="ノートを書く"
          onClick={onNoteComposeClick}
        >
          <PencilLine className="h-4 w-4" />
          <span className="md:hidden">ノート</span>
          <span className="hidden md:inline">ノートを書く</span>
        </Button>
        <UserMenu user={user} logoutUrl={logoutUrl} />
      </div>
    </section>
  );
}
