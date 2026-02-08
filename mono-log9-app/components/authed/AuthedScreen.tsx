import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import { stubPosts, stubTags, stubUser } from "@/components/authed/stubs";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-10">
        <header className="hidden" aria-hidden="true">
          <p>Authed header placeholder</p>
        </header>
        <main className="relative flex-1 md:grid md:grid-cols-[320px_1fr] md:gap-6">
          <article className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-6xl px-4 pb-4 md:static md:z-auto md:mx-0 md:w-auto md:max-w-none md:px-0 md:pb-0">
            <Container1 user={stubUser} tags={stubTags} logoutUrl={logoutUrl} />
          </article>
          <article className="pb-72 md:pb-0">
            <Container2 posts={stubPosts} tags={stubTags} />
          </article>
        </main>
        <footer className="hidden" aria-hidden="true">
          <p>Authed footer placeholder</p>
        </footer>
      </div>
    </div>
  );
}
