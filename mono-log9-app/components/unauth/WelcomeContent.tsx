export default function WelcomeContent() {
  return (
    <article className="space-y-6">
      <h2 className="text-xl font-semibold">
        メモとノートをまとめて管理しましょう
      </h2>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">このアプリについて</h3>
        <p className="text-sm leading-7 text-foreground/80">
          アプリ開発の学習のために制作した、シンプルなメモ/ノートアプリです。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          どなたでも無料でお試しいただけます。機密情報等は入力しないようお願いします。
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">免責事項</h3>
        <p className="text-sm leading-7 text-foreground/80">
          このアプリは予告なく変更・削除される場合があります。アプリのご利用に際しては、すべて利用者の責任においてご利用ください。
        </p>
      </div>
    </article>
  );
}
