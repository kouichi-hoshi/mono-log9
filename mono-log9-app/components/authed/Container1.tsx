"use client";

import ModeToggle from "@/components/authed/ModeToggle";
import PostEditor from "@/components/authed/PostEditor";
import UserMenu from "@/components/authed/UserMenu";
import type { PostMode, StubUser } from "@/components/authed/stubs";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Container1Props = {
  user: StubUser;
  mode: PostMode;
  favoriteOnly: boolean;
  logoutUrl: string;
  onModeChange: (mode: PostMode) => void;
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" className="max-w-2xl">
              <Plus className="h-4 w-4" />
              <span className="hidden text-xs md:inline">投稿する</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[min(92vw,560px)]">
            <AlertDialogHeader>
              <AlertDialogTitle>投稿エディタ</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="mt-4">
              <PostEditor mode={mode} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>閉じる</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <UserMenu user={user} logoutUrl={logoutUrl} />
      </div>
    </section>
  );
}
