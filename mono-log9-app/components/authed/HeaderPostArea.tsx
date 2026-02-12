"use client";

import PostEditor from "@/components/authed/PostEditor";
import type { ViewMode } from "@/components/authed/stubs";

type HeaderPostAreaProps = {
  viewMode: ViewMode;
};

export default function HeaderPostArea({ viewMode }: HeaderPostAreaProps) {
  if (viewMode === "note") {
    return null;
  }

  return <PostEditor mode="memo" />;
}
