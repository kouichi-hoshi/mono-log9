"use client";

import * as React from "react";
import { toast } from "sonner";

import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal from "@/components/authed/NoteComposerModal";
import {
  stubPosts,
  stubTrashPosts,
  stubUser,
  type StubPost,
  type StubTrashPost,
  type ViewMode,
} from "@/components/authed/stubs";
import type { NoteDraft } from "@/components/authed/types";

type AuthedScreenProps = {
  logoutUrl: string;
};

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  const [view, setView] = React.useState<"list" | "trash">("list");
  const [mode, setMode] = React.useState<ViewMode>("memo");
  const [favoriteOnlyByMode, setFavoriteOnlyByMode] = React.useState<Record<ViewMode, boolean>>({
    memo: false,
    note: false,
  });
  const [posts, setPosts] = React.useState<StubPost[]>(() => stubPosts);
  const [trashPosts] = React.useState<StubTrashPost[]>(() => stubTrashPosts);

  const [memoDraft, setMemoDraft] = React.useState("");
  const [editingMemoPostId, setEditingMemoPostId] = React.useState<string | null>(null);
  const [editingMemoValue, setEditingMemoValue] = React.useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteModalMode, setNoteModalMode] = React.useState<"create" | "edit">("create");
  const [noteModalInitialTitle, setNoteModalInitialTitle] = React.useState("");
  const [noteModalInitialContent, setNoteModalInitialContent] = React.useState("");

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

  const handleModeChange = React.useCallback((nextMode: ViewMode) => {
    setMode(nextMode);
    setView("list");
  }, []);

  const handleTrashClick = React.useCallback(() => {
    setView((current) => (current === "trash" ? current : "trash"));
  }, []);

  const handleToggleFavorite = React.useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, favorite: !post.favorite } : post
      )
    );
  }, []);

  const handleOpenNoteCreate = React.useCallback(() => {
    setNoteModalMode("create");
    setNoteModalInitialTitle("");
    setNoteModalInitialContent("");
    setIsNoteModalOpen(true);
  }, []);

  const handleEdit = React.useCallback(
    (postId: string) => {
      const target = posts.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      if (target.mode === "memo") {
        setEditingMemoPostId(postId);
        setEditingMemoValue(target.content);
        return;
      }

      setNoteModalMode("edit");
      setNoteModalInitialTitle(target.title ?? "");
      setNoteModalInitialContent(target.content);
      setIsNoteModalOpen(true);
    },
    [posts]
  );

  const handleMemoSaveStub = React.useCallback((value: string) => {
    void value;
    toast("未実装です");
    setMemoDraft("");
  }, []);

  const handleMemoEditSaveStub = React.useCallback((postId: string, value: string) => {
    void postId;
    void value;
    toast("未実装です");
    setEditingMemoPostId(null);
    setEditingMemoValue("");
  }, []);

  const handleMemoEditCancel = React.useCallback(() => {
    setEditingMemoPostId(null);
    setEditingMemoValue("");
  }, []);

  const handleNoteSaveStub = React.useCallback(
    (draft: NoteDraft) => {
      void draft;
      toast("未実装です");
      if (noteModalMode === "edit") {
        setNoteModalMode("create");
      }
    },
    [noteModalMode]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0">
        <h1 className="sr-only">Mono Log</h1>
        <div className="border-b-2 bg-white/80 px-4 py-4">
          <div className="mx-auto w-full max-w-6xl">
            <Container1
              user={stubUser}
              mode={mode}
              view={view}
              logoutUrl={logoutUrl}
              onModeChange={handleModeChange}
              onTrashClick={handleTrashClick}
            />
          </div>
        </div>
      </header>
      {view === "list" && (
        <section className="mx-auto w-full max-w-4xl px-4 py-4 md:px-6">
          <HeaderPostArea
            viewMode={mode}
            onNoteComposeClick={handleOpenNoteCreate}
            memoDraft={memoDraft}
            onMemoDraftChange={setMemoDraft}
            onMemoSaveStub={handleMemoSaveStub}
          />
        </section>
      )}
      <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <article>
          <Container2
            mode={mode}
            isTrashView={view === "trash"}
            favoriteOnly={favoriteOnly}
            posts={filteredPosts}
            trashPosts={trashPosts}
            onFavoriteToggle={handleFavoriteFilterToggle}
            onToggleFavorite={handleToggleFavorite}
            onEdit={handleEdit}
            editingMemoPostId={editingMemoPostId}
            editingMemoValue={editingMemoValue}
            onMemoEditValueChange={setEditingMemoValue}
            onCancelMemoEdit={handleMemoEditCancel}
            onSaveMemoEditStub={handleMemoEditSaveStub}
          />
        </article>
      </main>
      <NoteComposerModal
        open={isNoteModalOpen}
        onOpenChange={setIsNoteModalOpen}
        mode={noteModalMode}
        initialTitle={noteModalInitialTitle}
        initialContent={noteModalInitialContent}
        onSaveStub={handleNoteSaveStub}
      />
      <footer className="hidden">© Mono Log</footer>
    </div>
  );
}
