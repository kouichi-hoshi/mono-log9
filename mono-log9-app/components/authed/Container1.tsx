"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";

import ModeToggle, { type Mode } from "@/components/authed/ModeToggle";
import PostEditor from "@/components/authed/PostEditor";
import PostSearch from "@/components/authed/PostSearch";
import TagEditor from "@/components/authed/TagEditor";
import UserMenu from "@/components/authed/UserMenu";
import type { StubTag, StubUser } from "@/components/authed/stubs";

type Container1Props = {
  user: StubUser;
  tags: StubTag[];
  logoutUrl: string;
};

export default function Container1({ user, tags, logoutUrl }: Container1Props) {
  const [mode, setMode] = useState<Mode>("memo");

  return (
    <section className="rounded-xl border border-foreground/10 bg-background/95 p-4 shadow-sm backdrop-blur md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5 text-foreground/80">
            <NotebookPen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Mono Log</p>
            <p className="text-xs text-foreground/60">ログイン中</p>
          </div>
        </div>
        <UserMenu user={user} logoutUrl={logoutUrl} />
      </div>

      <div className="mt-4 space-y-4">
        <ModeToggle mode={mode} onChange={setMode} />
        <PostSearch tags={tags} />
        <PostEditor mode={mode} />
        <TagEditor tags={tags} />
      </div>
    </section>
  );
}
