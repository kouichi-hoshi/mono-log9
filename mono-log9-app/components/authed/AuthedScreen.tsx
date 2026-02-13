"use client";

import * as React from "react";

import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal from "@/components/authed/NoteComposerModal";
import { stubPosts, stubUser, type StubPost, type ViewMode } from "@/components/authed/stubs";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  const [mode, setMode] = React.useState<ViewMode>("memo");
  const [favoriteOnlyByMode, setFavoriteOnlyByMode] = React.useState<Record<ViewMode, boolean>>({
    memo: false,
    note: false,
  });
  const [posts, setPosts] = React.useState<StubPost[]>(() => stubPosts);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const favoriteOnly = favoriteOnlyByMode[mode];

  const filteredPosts = React.useMemo(() => {
    return posts.filter((post) => {
      if (post.mode !== mode) {
        return false;
      }

      if (favoriteOnly && !post.favorite) {
        return false;
      }

      return true;
    });
  }, [favoriteOnly, mode, posts]);

  const handleFavoriteFilterToggle = React.useCallback(() => {
    setFavoriteOnlyByMode((current) => ({
      ...current,
      [mode]: !current[mode],
    }));
  }, [mode]);

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
              logoutUrl={logoutUrl}
              onModeChange={setMode}
            />
          </div>
        </div>
      </header>
      <section className="mx-auto w-full max-w-4xl px-4 py-4 md:px-6">
        <HeaderPostArea viewMode={mode} onNoteComposeClick={() => setIsNoteModalOpen(true)} />
      </section>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <article>
              <Container2
                mode={mode}
                favoriteOnly={favoriteOnly}
                posts={filteredPosts}
                onFavoriteToggle={handleFavoriteFilterToggle}
                onToggleFavorite={handleToggleFavorite}
              />
        </article>
      </main>
      <NoteComposerModal open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen} />
      <footer className="hidden">© Mono Log</footer>
    </div>
  );
}
