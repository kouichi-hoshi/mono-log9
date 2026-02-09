"use client";

import ModeToggle from "@/components/authed/ModeToggle";
import PostEditor from "@/components/authed/PostEditor";
import PostSearch from "@/components/authed/PostSearch";
import TagCloud from "@/components/authed/TagCloud";
import UserMenu from "@/components/authed/UserMenu";
import type { Tag } from "@/components/authed/stubs";
import { cn } from "@/lib/utils";

type Container1Props = {
  tags: Tag[];
  user: {
    name: string;
    handle: string;
    avatarFallback: string;
  };
  className?: string;
};

export default function Container1({ tags, user, className }: Container1Props) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-t-2xl border border-foreground/10 bg-background/95 p-4 shadow-lg backdrop-blur md:rounded-2xl md:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground/60">Service</p>
          <p className="text-base font-semibold">Mono Log</p>
        </div>
        <UserMenu user={user} />
      </div>
      <ModeToggle />
      <PostEditor tags={tags} />
      <PostSearch tags={tags} />
      <TagCloud tags={tags.slice(0, 6)} label="注目タグ" />
    </section>
  );
}
