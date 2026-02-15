"use client";

import * as React from "react";
import { toast } from "sonner";

import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal from "@/components/authed/NoteComposerModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [selectedTrashPostIds, setSelectedTrashPostIds] = React.useState<Set<string>>(() => new Set());
  const [deleteDialogMode, setDeleteDialogMode] = React.useState<"selected" | "all" | null>(null);

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

  React.useEffect(() => {
    if (view !== "trash") {
      setSelectedTrashPostIds(new Set());
    }
  }, [view]);

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

  const handleToggleTrashPostSelection = React.useCallback((postId: string, checked: boolean) => {
    setSelectedTrashPostIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }, []);

  const handleSelectAllVisibleTrashPosts = React.useCallback(() => {
    setSelectedTrashPostIds(new Set(trashPosts.map((post) => post.id)));
  }, [trashPosts]);

  const handleClearTrashPostSelection = React.useCallback(() => {
    setSelectedTrashPostIds(new Set());
  }, []);

  const handleRequestDeleteSelectedTrashPosts = React.useCallback(() => {
    if (selectedTrashPostIds.size === 0) {
      return;
    }
    setDeleteDialogMode("selected");
  }, [selectedTrashPostIds]);

  const handleRequestEmptyTrash = React.useCallback(() => {
    if (trashPosts.length === 0) {
      return;
    }
    setDeleteDialogMode("all");
  }, [trashPosts.length]);

  const handleConfirmDelete = React.useCallback(() => {
    toast("未実装です");
    setDeleteDialogMode(null);
  }, []);

  const handleDeleteDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setDeleteDialogMode(null);
    }
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
            selectedTrashPostIds={selectedTrashPostIds}
            onToggleTrashPostSelection={handleToggleTrashPostSelection}
            onSelectAllVisibleTrashPosts={handleSelectAllVisibleTrashPosts}
            onClearTrashPostSelection={handleClearTrashPostSelection}
            onRequestDeleteSelectedTrashPosts={handleRequestDeleteSelectedTrashPosts}
            onRequestEmptyTrash={handleRequestEmptyTrash}
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
      <AlertDialog open={deleteDialogMode !== null} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogMode === "selected"
                ? `${selectedTrashPostIds.size}件の投稿を完全に削除しますか?`
                : "ごみ箱内のすべての投稿を完全に削除しますか?"}
            </AlertDialogTitle>
            <AlertDialogDescription>この操作は取り消せません</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <footer className="hidden">© Mono Log</footer>
    </div>
  );
}
