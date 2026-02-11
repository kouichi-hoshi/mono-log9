"use client";

import { List, NotebookPen, Star, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";

type ModeToggleProps = {
  className?: string;
  mode: ViewMode;
  favoriteOnly: boolean;
  onChange: (mode: ViewMode) => void;
  onFavoriteToggle: () => void;
};

export default function ModeToggle({
  className,
  mode,
  favoriteOnly,
  onChange,
  onFavoriteToggle,
}: ModeToggleProps) {
  const handleChange = (next: ViewMode) => {
    onChange(next);
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
    <div className={cn("flex w-full flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "gap-2",
          mode === "all" && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => handleChange("all")}
      >
        <List className="h-4 w-4" />
        <span className="hidden text-xs md:inline">全て</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "gap-2",
          mode === "memo" && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => handleChange("memo")}
      >
        <StickyNote className="h-4 w-4" />
        <span className="hidden text-xs md:inline">メモ</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "gap-2",
          mode === "note" && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => handleChange("note")}
      >
        <NotebookPen className="h-4 w-4" />
        <span className="hidden text-xs md:inline">ノート</span>
      </Button>
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
  );
}
