"use client";

import { NotebookPen, StickyNote, Trash2 } from "lucide-react";

import UserMenu from "@/components/authed/UserMenu";
import type { AuthedUser, ViewMode } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScreenView = "list" | "trash";

type Container1Props = {
  user: AuthedUser;
  mode: ViewMode;
  view: ScreenView;
  onLogout: () => Promise<void>;
  isLogoutSubmitting?: boolean;
  onModeChange: (mode: ViewMode) => void;
  onTrashClick: () => void;
};

export default function Container1({
  user,
  mode,
  view,
  onLogout,
  isLogoutSubmitting = false,
  onModeChange,
  onTrashClick,
}: Container1Props) {
  return (
    <section>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 md:grid-cols-[repeat(4,max-content)_1fr_max-content_max-content] md:items-center">
        <div className="min-w-0 flex flex-wrap gap-2 md:contents">
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              view === "list" && mode === "memo" && "bg-foreground text-background hover:bg-foreground/90"
            )}
            onClick={() => onModeChange("memo")}
            aria-pressed={view === "list" && mode === "memo"}
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden text-xs md:inline">メモ</span>
          </Button>
          </div>
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              view === "list" && mode === "note" && "bg-foreground text-background hover:bg-foreground/90"
            )}
            onClick={() => onModeChange("note")}
            aria-pressed={view === "list" && mode === "note"}
          >
            <NotebookPen className="h-4 w-4" />
            <span className="hidden text-xs md:inline">ノート</span>
          </Button>
          </div>
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-2", view === "trash" && "bg-foreground text-background hover:bg-foreground/90")}
            onClick={onTrashClick}
            aria-pressed={view === "trash"}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden text-xs md:inline">ごみ箱</span>
          </Button>
          </div>
          <div className="hidden md:block" />
        </div>
        <div className="justify-self-end">
          <UserMenu user={user} onLogout={onLogout} isLogoutSubmitting={isLogoutSubmitting} />
        </div>
      </div>
    </section>
  );
}
