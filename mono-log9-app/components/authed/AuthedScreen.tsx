"use client";

import * as React from "react";

import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import { stubPosts, stubUser, type PostMode, type StubPost, type ViewMode } from "@/components/authed/stubs";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  const [mode, setMode] = React.useState<ViewMode>("all");
  const [composeTab, setComposeTab] = React.useState<PostMode>("memo");
  const [favoriteOnly, setFavoriteOnly] = React.useState(false);
  const [posts, setPosts] = React.useState<StubPost[]>(() => stubPosts);

  const filteredPosts = React.useMemo(() => {
    return posts.filter((post) => {
      if (mode !== "all" && post.mode !== mode) {
        return false;
      }

      if (favoriteOnly && !post.favorite) {
        return false;
      }

      return true;
    });
  }, [favoriteOnly, mode, posts]);

  const handleToggleFavorite = React.useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, favorite: !post.favorite } : post
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0">
        <h1 className="sr-only">Mono Log</h1>
        <div className="border-b-2 bg-white/80 px-4 py-4">
          <div className="mx-auto w-full max-w-6xl">
            <Container1
              user={stubUser}
              mode={mode}
              favoriteOnly={favoriteOnly}
              logoutUrl={logoutUrl}
              onModeChange={setMode}
              onFavoriteToggle={() => setFavoriteOnly((current) => !current)}
            />
          </div>
        </div>
      </header>
      <section className="mx-auto w-full max-w-4xl px-4 py-4 md:px-6">
        <HeaderPostArea
          viewMode={mode}
          composeTab={composeTab}
          onComposeTabChange={setComposeTab}
        />
      </section>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <article>
          <Container2
            mode={mode}
            posts={filteredPosts}
            onToggleFavorite={handleToggleFavorite}
          />
        </article>
      </main>
      <footer className="hidden">© Mono Log</footer>
    </div>
  );
}
