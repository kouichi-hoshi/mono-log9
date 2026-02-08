import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_320px] md:px-6">
        <main className="space-y-6">
          <article className="rounded-lg border border-foreground/10 p-4">
            <h1 className="text-lg font-semibold">ログイン中（スタブ）</h1>
            <p className="mt-2 text-sm text-foreground/80">
              `stubAuth=1` を検出したため、ログイン中画面を表示しています。
            </p>
          </article>
          <article className="rounded-lg border border-foreground/10 p-4 text-sm text-foreground/80">
            ログイン中UIの詳細実装は、作業計画書の後続タスクで追加します。
          </article>
        </main>
        <aside className="rounded-lg border border-foreground/10 p-4">
          <p className="mb-3 text-sm font-medium">ユーザー操作</p>
          <Button asChild className="w-full">
            <Link href={logoutUrl}>ログアウト</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
