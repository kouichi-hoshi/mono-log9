"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  listPostsAction,
  setFavoriteAction,
  type ActionResult,
} from "@/app/actions/postActions";
import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal from "@/components/authed/NoteComposerModal";
import { stubUser, type ViewMode } from "@/components/authed/stubs";
import type { NoteDraft } from "@/components/authed/types";
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
  buildQueryForFavoriteToggle,
  buildQueryForViewChange,
  normalizeAuthedQuery,
  toRootPath,
} from "@/lib/authedQueryState";
import type { ListPostsResult, PostRecord, PostView } from "@/lib/posts/types";

type AuthedScreenProps = {
  logoutUrl: string;
};

type ListState = {
  view: PostView | null;
  isLoading: boolean;
  items: PostRecord[];
  nextCursor: string | null;
  hasNext: boolean;
  error: { code: string; message: string } | null;
};

const INITIAL_LIST_STATE: ListState = {
  view: null,
  isLoading: true,
  items: [],
  nextCursor: null,
  hasNext: false,
  error: null,
};

function toFailedState(
  view: PostView,
  result: Extract<ActionResult<ListPostsResult>, { ok: false }>
): ListState {
  return {
    view,
    isLoading: false,
    items: [],
    nextCursor: null,
    hasNext: false,
    error: result.error,
  };
}

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const normalizedQuery = React.useMemo(
    () => normalizeAuthedQuery(queryString),
    [queryString]
  );
  const isTrashView = normalizedQuery.state.view === "trash";
  const mode: ViewMode = normalizedQuery.state.activeMode ?? "memo";
  const favoriteOnly = isTrashView
    ? false
    : mode === "memo"
      ? normalizedQuery.state.favoriteMemo
      : normalizedQuery.state.favoriteNote;

  const [listState, setListState] = React.useState<ListState>(INITIAL_LIST_STATE);
  const [memoDraft, setMemoDraft] = React.useState("");
  const [editingMemoPostId, setEditingMemoPostId] = React.useState<string | null>(null);
  const [editingMemoValue, setEditingMemoValue] = React.useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteModalMode, setNoteModalMode] = React.useState<"create" | "edit">("create");
  const [noteModalInitialTitle, setNoteModalInitialTitle] = React.useState("");
  const [noteModalInitialContent, setNoteModalInitialContent] = React.useState("");
  const [selectedTrashPostIds, setSelectedTrashPostIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [deleteDialogMode, setDeleteDialogMode] = React.useState<"selected" | "all" | null>(null);

  const visibleItems = React.useMemo(
    () => (listState.view === normalizedQuery.state.view ? listState.items : []),
    [listState.items, listState.view, normalizedQuery.state.view]
  );
  const posts = React.useMemo(
    () => (isTrashView ? [] : visibleItems),
    [isTrashView, visibleItems]
  );
  const trashPosts = React.useMemo(
    () => (isTrashView ? visibleItems : []),
    [isTrashView, visibleItems]
  );

  React.useEffect(() => {
    if (!normalizedQuery.changed) {
      return;
    }

    router.replace(toRootPath(normalizedQuery.nextQuery));
  }, [normalizedQuery.changed, normalizedQuery.nextQuery, router]);

  React.useEffect(() => {
    if (normalizedQuery.changed) {
      return;
    }

    let active = true;

    setListState((current) => ({
      ...current,
      view: normalizedQuery.state.view,
      isLoading: true,
      items: [],
      nextCursor: null,
      hasNext: false,
      error: null,
    }));

    void (async () => {
      const result = await listPostsAction({
        view: normalizedQuery.state.view,
        favoriteOnly,
        limit: 10,
      });

      if (!active) {
        return;
      }

      if (!result.ok) {
        setListState(toFailedState(normalizedQuery.state.view, result));
        toast.error(result.error.message);
        return;
      }

      setListState({
        view: normalizedQuery.state.view,
        isLoading: false,
        items: result.data.items,
        nextCursor: result.data.nextCursor,
        hasNext: result.data.hasNext,
        error: null,
      });
    })();

    return () => {
      active = false;
    };
  }, [favoriteOnly, normalizedQuery.changed, normalizedQuery.state.view]);

  const handleFavoriteFilterToggle = React.useCallback(() => {
    const next = buildQueryForFavoriteToggle(queryString);
    if (!next.changed) {
      return;
    }

    router.push(toRootPath(next.nextQuery));
  }, [queryString, router]);

  const handleModeChange = React.useCallback(
    (nextMode: ViewMode) => {
      const next = buildQueryForViewChange(queryString, nextMode);
      if (!next.changed) {
        return;
      }

      router.push(toRootPath(next.nextQuery));
    },
    [queryString, router]
  );

  const handleTrashClick = React.useCallback(() => {
    const next = buildQueryForViewChange(queryString, "trash");
    if (!next.changed) {
      return;
    }

    router.push(toRootPath(next.nextQuery));
  }, [queryString, router]);

  React.useEffect(() => {
    if (!isTrashView) {
      setSelectedTrashPostIds(new Set());
    }
  }, [isTrashView]);

  const handleToggleFavorite = React.useCallback(
    async (postId: string) => {
      const target = listState.items.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      const result = await setFavoriteAction({
        postId,
        favorite: !target.favorite,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      setListState((current) => ({
        ...current,
        items: current.items.flatMap((post) => {
          if (post.id !== result.data.id) {
            return [post];
          }

          if (favoriteOnly && !result.data.favorite) {
            return [];
          }

          return [{ ...post, favorite: result.data.favorite }];
        }),
      }));
    },
    [favoriteOnly, listState.items]
  );

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

  const handleRestoreTrashPostStub = React.useCallback((postId: string) => {
    void postId;
    toast("未実装です");
  }, []);

  const handlePermanentDeleteTrashPostStub = React.useCallback((postId: string) => {
    void postId;
    toast("未実装です");
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
              view={isTrashView ? "trash" : "list"}
              logoutUrl={logoutUrl}
              onModeChange={handleModeChange}
              onTrashClick={handleTrashClick}
            />
          </div>
        </div>
      </header>
      {!isTrashView && (
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
            isTrashView={isTrashView}
            favoriteOnly={favoriteOnly}
            posts={posts}
            trashPosts={trashPosts}
            isLoading={listState.isLoading}
            errorMessage={listState.error?.message ?? null}
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
            onRestoreTrashPostStub={handleRestoreTrashPostStub}
            onPermanentDeleteTrashPostStub={handlePermanentDeleteTrashPostStub}
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
