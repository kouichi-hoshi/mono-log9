import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import type { AuthMode } from "@/lib/auth/types";
import UnauthFooter from "@/components/unauth/UnauthFooter";
import UnauthHeader from "@/components/unauth/UnauthHeader";
import WelcomeContent from "@/components/unauth/WelcomeContent";

type UnauthScreenProps = {
  authMode: AuthMode;
  callbackUrl: string;
};

export default function UnauthScreen({
  authMode,
  callbackUrl,
}: UnauthScreenProps) {
  return (
    <div className="w-full bg-background text-foreground">
      <section className="px-6 pt-20 pb-12 text-center md:pt-32 md:pb-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 lg:gap-12">
          <UnauthHeader />
          <GoogleLoginButton authMode={authMode} callbackUrl={callbackUrl} />
        </div>
      </section>

      <section className="px-6 pt-6">
        <h2 className="text-center text-xl font-bold leading-8 lg:leading-12 lg:text-4xl">
          サクッと書いて、おしまい。
            <br />
            終わったらごみ箱へ。
        </h2>
        <div className="flex flex-col gap-4 lg:gap-6 mt-6 text-sm leading-8 md:text-lg lg:text-center">
          <p className="mx-auto w-fit">
          ちょっとしたメモを書きたいけど、<br className="hidden lg:block" />いつも使っているノートアプリに書くほどでもない。
          </p>
          <p className="mx-auto w-fit">
            ずっと後まで取っておきたいメモじゃない。<br className="hidden lg:block" />
            フォルダ分けも、締切設定も、履歴管理もいらない。
          </p>
          <p className="mx-auto w-fit">
            わざわざ使い方を覚えなくてもいい、アプリ。
          </p>
        </div>
      </section>

      <section className="px-6 pt-6 md:mt-12 lg:mt-18">
        <h2 className="text-center text-xl font-bold md:text-4xl">Mono Logの機能</h2>
        <div className="mt-6 lg:mt-12 mx-auto max-w-6xl">
          <WelcomeContent />
        </div>
      </section>

      <section className="px-6 pt-6 md:mt-12 lg:mt-18">
        <h2 className="text-center text-xl font-bold md:text-4xl">はじめ方</h2>
        <ul className="w-fit flex flex-col gap-2 mt-4 mx-auto lg:text-center">
          <li>Googleアカウントでログインするだけで、すぐに使えます。アカウント登録は不要です。</li>
          <li>スマートフォン・PCのブラウザどちらでも動作します。</li>
          <li>ブラウザからホーム画面やデスクトップに追加すれば、アプリとして起動できます。</li>
          <li>書いたメモはクラウドに保存されるため、端末をまたいで同期されます。</li>
        </ul>
      </section>

      <section className="px-6 pt-6 md:mt-12 lg:mt-18">
        <h2 className="text-center text-xl font-bold md:text-4xl">免責事項</h2>
        <ul className="w-fit flex flex-col gap-2 mt-4 mx-auto lg:text-center">
          <li>本サービスは無料で提供しています。</li>
          <li>サービスの継続性や完全性を保証するものではなく、予告なく内容の変更・停止・終了する場合があります。</li>
          <li>利用者が本サービスの利用によって生じた損害について、開発者は責任を負いかねます。</li>
          <li>重要なデータは必ずバックアップを取るようお願いします。</li>
        </ul>
      </section>

      <UnauthFooter />
    </div>
  );
}
