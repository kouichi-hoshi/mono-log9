"use client";

import { List, NotebookPen, PencilLine, Star, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import UserMenu from "@/components/authed/UserMenu";
import type { StubUser, ViewMode } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const handleModeChange = (next: ViewMode) => {
    onModeChange(next);
    toast("未実装です");
  };

  const handleFavoriteToggle = () => {
    onFavoriteToggle();
    toast("未実装です");
  };

  const handleTrashClick = () => {
    toast("未実装です");
  };

  return (
    <section>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 md:grid-cols-[repeat(5,max-content)_1fr_max-content_max-content] md:items-center">
        <div className="min-w-0 flex flex-wrap gap-2 md:contents">
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              mode === "all" && "bg-foreground text-background hover:bg-foreground/90"
            )}
            onClick={() => handleModeChange("all")}
          >
            <List className="h-4 w-4" />
            <span className="hidden text-xs md:inline">全て</span>
          </Button>
          </div>
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              mode === "memo" && "bg-foreground text-background hover:bg-foreground/90"
            )}
            onClick={() => handleModeChange("memo")}
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
              mode === "note" && "bg-foreground text-background hover:bg-foreground/90"
            )}
            onClick={() => handleModeChange("note")}
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
            className={cn("gap-2", favoriteOnly && "border-amber-400 text-amber-500")}
            onClick={handleFavoriteToggle}
            aria-pressed={favoriteOnly}
          >
            <Star className={cn("h-4 w-4", favoriteOnly && "fill-amber-400")} />
            <span className="hidden text-xs md:inline">お気に入り</span>
          </Button>
          </div>
          <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleTrashClick}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden text-xs md:inline">ごみ箱</span>
          </Button>
          </div>
          <div className="hidden md:block" />
          <div>
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
          </div>
        </div>
        <div className="justify-self-end">
          <UserMenu user={user} logoutUrl={logoutUrl} />
        </div>
      </div>
    </section>
  );
}
