"use client";

import { Skeleton } from "@/components/ui/skeleton";

type LoadingStatesProps = {
  showEmpty: boolean;
  showInitialSkeleton: boolean;
  showNextPageSkeleton?: boolean;
};

export default function LoadingStates({
  showEmpty,
  showInitialSkeleton,
  showNextPageSkeleton = false,
}: LoadingStatesProps) {
  return (
    <div className="space-y-4">
      {showEmpty && (
        <div className="rounded-lg border border-dashed border-foreground/20 p-6 text-center text-sm text-foreground/60">
          投稿がありません。
        </div>
      )}
      {showInitialSkeleton && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/60">読み込み中</p>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}
      {showNextPageSkeleton && (
        <div className="space-y-2">
          <p className="text-xs text-foreground/60">追加読み込み中</p>
          <Skeleton className="h-20 w-full" />
        </div>
      )}
    </div>
  );
}
