export default function WelcomeContent() {
  return (
    <article className="space-y-6">
      <h2 className="text-2xl font-semibold">
        サクッと書いて、おしまい。それだけのメモアプリです。
      </h2>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">このアプリについて</h3>
        <p className="text-sm leading-7 text-foreground/80">
          ちょっとしたメモを書きたいけど、いつも使っているノートアプリに書くほどでもない。フォルダ分けも、締切設定も、履歴管理もいらない。ずっと後まで取っておきたいメモじゃない。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          書いて、終わり。終わったらごみ箱へ。そんなシンプルなメモ置き場です。
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">メモとノートの使い分け</h3>
        <p className="text-sm leading-7 text-foreground/80">
          メモは一行の短文入力で、ToDoリストのように一覧で確認できます。ノートは長い文章を書きたいときに。同じアプリ内で、用途に応じて切り替えて使えます。
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">はじめ方</h3>
        <p className="text-sm leading-7 text-foreground/80">
          Googleアカウントでログインするだけで、すぐに使えます。アカウント登録は不要です。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          スマートフォン・PCのブラウザどちらでも動作します。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          ブラウザからホーム画面やデスクトップに追加すれば、アプリとして起動できます。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          書いた内容はアカウントに紐づいて保存され、同じGoogleアカウントでログインすれば別の端末からも確認できます。
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-semibold">免責事項</h3>
        <p className="text-sm leading-7 text-foreground/80">
          本サービスは無料で提供しています。サービスの継続性や完全性を保証するものではなく、予告なく内容の変更・停止・終了する場合があります。
        </p>
        <p className="text-sm leading-7 text-foreground/80">
          利用者が本サービスの利用によって生じた損害について、開発者は責任を負いかねます。重要なデータは必ずバックアップを取るようお願いします。
        </p>
      </div>
    </article>
  );
}
