"use client";

import { notifyNotImplemented } from "@/components/authed/notImplemented";
import type { Tag } from "@/components/authed/stubs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TagCloudProps = {
  tags: Tag[];
  className?: string;
  label?: string;
};

export default function TagCloud({ tags, className, label }: TagCloudProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-xs font-semibold text-foreground/70">{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Button
            key={tag.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => notifyNotImplemented(`タグ「${tag.label}」を選択`)}
          >
            {tag.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
