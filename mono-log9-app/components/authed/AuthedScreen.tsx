"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  createPostAction,
  listPostsAction,
  moveToTrashAction,
  restoreFromTrashAction,
  setFavoriteAction,
  type ActionResult,
  updatePostAction,
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
import { clonePostContent, createDocFromPlainText } from "@/lib/posts/content";
import type { ListPostsResult, PostContent, PostRecord, PostView } from "@/lib/posts/types";

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

function sortByCreatedAtDesc(a: PostRecord, b: PostRecord): number {
  if (a.createdAt === b.createdAt) {
    return b.id.localeCompare(a.id);
  }

  return b.createdAt.localeCompare(a.createdAt);
}

function sortByTrashedAtDesc(a: PostRecord, b: PostRecord): number {
  const aTrashedAt = a.trashedAt ?? "";
  const bTrashedAt = b.trashedAt ?? "";

  if (aTrashedAt === bTrashedAt) {
    return b.id.localeCompare(a.id);
  }

  return bTrashedAt.localeCompare(aTrashedAt);
}

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
  const [noteModalInitialContent, setNoteModalInitialContent] = React.useState<PostContent | null>(
    null
  );
  const [noteModalInitialPlainText, setNoteModalInitialPlainText] = React.useState("");
  const [editingNotePostId, setEditingNotePostId] = React.useState<string | null>(null);
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
    setEditingNotePostId(null);
    setNoteModalInitialTitle("");
    setNoteModalInitialContent(null);
    setNoteModalInitialPlainText("");
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
        setEditingMemoValue(target.contentText);
        return;
      }

      setNoteModalMode("edit");
      setEditingNotePostId(postId);
      setNoteModalInitialTitle(target.title ?? "");
      setNoteModalInitialContent(target.content);
      setNoteModalInitialPlainText(target.contentText);
      setIsNoteModalOpen(true);
    },
    [posts]
  );

  const upsertPostInVisibleList = React.useCallback(
    (updated: PostRecord) => {
      setListState((current) => {
        if (current.view !== normalizedQuery.state.view) {
          return current;
        }

        if (normalizedQuery.state.view === "trash") {
          if (typeof updated.trashedAt === "undefined") {
            return current;
          }

          const nextItems = [updated, ...current.items.filter((item) => item.id !== updated.id)].sort(
            sortByTrashedAtDesc
          );
          return { ...current, items: nextItems };
        }

        const isVisibleModePost =
          updated.mode === normalizedQuery.state.view && typeof updated.trashedAt === "undefined";
        const canDisplay = isVisibleModePost && (!favoriteOnly || updated.favorite);
        if (!canDisplay) {
          return {
            ...current,
            items: current.items.filter((item) => item.id !== updated.id),
          };
        }

        const nextItems = [updated, ...current.items.filter((item) => item.id !== updated.id)].sort(
          sortByCreatedAtDesc
        );
        return { ...current, items: nextItems };
      });
    },
    [favoriteOnly, normalizedQuery.state.view]
  );

  const handleMemoSaveStub = React.useCallback(
    async (value: string) => {
      const result = await createPostAction({
        mode: "memo",
        content: createDocFromPlainText(value),
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return false;
      }

      upsertPostInVisibleList(result.data);
      setMemoDraft("");
      toast("保存しました");
      return true;
    },
    [upsertPostInVisibleList]
  );

  const handleMemoEditSaveStub = React.useCallback(
    async (postId: string, value: string) => {
      const result = await updatePostAction({
        postId,
        content: createDocFromPlainText(value),
      });

      if (!result.ok) {
        console.log("[AuthedScreen] note save failed", result.error, draft.contentJson);
        toast.error(result.error.message);
        return false;
      }

      upsertPostInVisibleList(result.data);
      setEditingMemoPostId(null);
      setEditingMemoValue("");
      toast("更新しました");
      return true;
    },
    [upsertPostInVisibleList]
  );

  const handleMemoEditCancel = React.useCallback(() => {
    setEditingMemoPostId(null);
    setEditingMemoValue("");
  }, []);

  const handleNoteSaveStub = React.useCallback(
    async (draft: NoteDraft) => {
      if (!draft.contentJson) {
        return false;
      }
      const serializedContent = clonePostContent(draft.contentJson);

      const result =
        noteModalMode === "edit" && editingNotePostId
          ? await updatePostAction({
              postId: editingNotePostId,
              title: draft.title,
              content: serializedContent,
            })
          : await createPostAction({
              mode: "note",
              title: draft.title,
              content: serializedContent,
            });

      if (!result.ok) {
        toast.error(result.error.message);
        return false;
      }

      upsertPostInVisibleList(result.data);
      toast(noteModalMode === "edit" ? "更新しました" : "保存しました");

      if (noteModalMode === "edit") {
        setNoteModalMode("create");
        setEditingNotePostId(null);
      }

      return true;
    },
    [editingNotePostId, noteModalMode, upsertPostInVisibleList]
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

  const handleMoveToTrash = React.useCallback(async (postId: string) => {
    const result = await moveToTrashAction({ postId });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    setListState((current) => ({
      ...current,
      items: current.items.filter((post) => post.id !== postId),
    }));
    if (editingMemoPostId === postId) {
      setEditingMemoPostId(null);
      setEditingMemoValue("");
    }
    toast("投稿を削除しました");
  }, [editingMemoPostId]);

  const handleRestoreTrashPostStub = React.useCallback(async (postId: string) => {
    const result = await restoreFromTrashAction({ postId });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    setListState((current) => ({
      ...current,
      items: current.items.filter((post) => post.id !== postId),
    }));
    setSelectedTrashPostIds((current) => {
      const next = new Set(current);
      next.delete(postId);
      return next;
    });
    toast("投稿を復元しました");
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
            onMoveToTrash={handleMoveToTrash}
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
        initialContentJson={noteModalInitialContent}
        initialPlainText={noteModalInitialPlainText}
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
