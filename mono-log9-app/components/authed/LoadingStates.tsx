"use client";

import { Skeleton } from "@/components/ui/skeleton";

type LoadingStatesProps = {
  showEmpty: boolean;
  showSkeleton: boolean;
};

export default function LoadingStates({ showEmpty, showSkeleton }: LoadingStatesProps) {
  return (
    <div className="space-y-4">
      {showEmpty && (
        <div className="rounded-lg border border-dashed border-foreground/20 p-6 text-center text-sm text-foreground/60">
          投稿がありません。
        </div>
      )}
      {showSkeleton && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/60">読み込み中</p>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
