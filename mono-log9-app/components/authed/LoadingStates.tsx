import { Inbox } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingStates() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-foreground/10 bg-background p-4">
        <p className="text-sm font-semibold text-foreground">
          読み込み中（スタブ）
        </p>
        <div className="mt-3 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-background p-4 text-center">
        <Inbox className="mx-auto h-6 w-6 text-foreground/50" />
        <p className="mt-2 text-sm font-semibold">まだ投稿がありません</p>
        <p className="mt-1 text-xs text-foreground/60">
          ここに空の状態を表示します。
        </p>
      </div>
    </section>
  );
}
