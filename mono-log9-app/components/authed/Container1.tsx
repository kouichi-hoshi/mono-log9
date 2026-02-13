"use client";

import { NotebookPen, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import UserMenu from "@/components/authed/UserMenu";
import type { StubUser, ViewMode } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Container1Props = {
  user: StubUser;
  mode: ViewMode;
  logoutUrl: string;
  onModeChange: (mode: ViewMode) => void;
};

export default function Container1({
  user,
  mode,
  logoutUrl,
  onModeChange,
}: Container1Props) {
  const handleModeChange = (next: ViewMode) => {
    onModeChange(next);
    toast("未実装です");
  };

  const handleTrashClick = () => {
    toast("未実装です");
  };

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
            className="gap-2"
            onClick={handleTrashClick}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden text-xs md:inline">ごみ箱</span>
          </Button>
          </div>
          <div className="hidden md:block" />
        </div>
        <div className="justify-self-end">
          <UserMenu user={user} logoutUrl={logoutUrl} />
        </div>
      </div>
    </section>
  );
}
