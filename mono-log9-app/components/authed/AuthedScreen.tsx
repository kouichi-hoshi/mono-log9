import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import { stubPosts, stubTags, stubUser } from "@/components/authed/stubs";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="hidden" aria-hidden="true">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <span className="text-sm font-semibold">Mono Log</span>
          <span className="text-xs text-foreground/60">{logoutUrl}</span>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-[320px] pt-6 md:px-6 md:pb-10">
        <div className="md:grid md:grid-cols-[320px_1fr] md:gap-6">
          <article className="md:sticky md:top-6 md:self-start">
            <div className="fixed inset-x-0 bottom-0 z-30 max-h-[320px] overflow-y-auto md:static md:inset-auto md:max-h-none md:overflow-visible">
              <Container1 tags={stubTags} user={stubUser} />
            </div>
          </article>
          <article className="space-y-4 md:space-y-6 md:pb-0">
            <Container2 posts={stubPosts} />
          </article>
        </div>
      </main>
      <footer className="hidden" aria-hidden="true">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-foreground/60 md:px-6">
          Mono Log (stub footer)
        </div>
      </footer>
    </div>
  );
}
