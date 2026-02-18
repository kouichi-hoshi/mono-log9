"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  createPostAction,
  moveToTrashAction,
  restoreFromTrashAction,
  setFavoriteAction,
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
import {
  flattenInfiniteItems,
  rebuildInfiniteData,
  type PostsInfiniteData,
} from "@/lib/posts/infiniteData";
import {
  normalizePostsListCondition,
  postsListQueryKey,
  type PostsListCondition,
} from "@/lib/posts/queryKeys";
import {
  getScrollStorageKey,
  readScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
} from "@/lib/posts/scrollRestoration";
import type { PostContent, PostRecord, PostView } from "@/lib/posts/types";
import { PostsListQueryError, usePostsInfiniteQuery } from "@/lib/posts/usePostsInfiniteQuery";

type AuthedScreenProps = {
  logoutUrl: string;
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

function toErrorMessage(error: unknown): string | null {
  if (error instanceof PostsListQueryError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

function upsertForCurrentView(
  items: PostRecord[],
  updated: PostRecord,
  view: PostView,
  favoriteOnly: boolean
): PostRecord[] {
  if (view === "trash") {
    if (typeof updated.trashedAt === "undefined") {
      return items.filter((item) => item.id !== updated.id);
    }

    return [updated, ...items.filter((item) => item.id !== updated.id)].sort(sortByTrashedAtDesc);
  }

  const isVisibleModePost = updated.mode === view && typeof updated.trashedAt === "undefined";
  const canDisplay = isVisibleModePost && (!favoriteOnly || updated.favorite);

  if (!canDisplay) {
    return items.filter((item) => item.id !== updated.id);
  }

  return [updated, ...items.filter((item) => item.id !== updated.id)].sort(sortByCreatedAtDesc);
}

function formatNowDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function parsePostsListConditionFromQueryKey(key: QueryKey): PostsListCondition | null {
  if (!Array.isArray(key) || key.length < 2 || key[0] !== "posts") {
    return null;
  }

  const condition = key[1];
  if (!condition || typeof condition !== "object") {
    return null;
  }

  const view = (condition as { view?: unknown }).view;
  const favoriteOnly = (condition as { favoriteOnly?: unknown }).favoriteOnly;
  if (view !== "memo" && view !== "note" && view !== "trash") {
    return null;
  }

  if (typeof favoriteOnly !== "boolean") {
    return null;
  }

  return normalizePostsListCondition({ view, favoriteOnly });
}

export default function AuthedScreen({ logoutUrl }: AuthedScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const queryString = searchParams.toString();
  const normalizedQuery = React.useMemo(() => normalizeAuthedQuery(queryString), [queryString]);
  const isTrashView = normalizedQuery.state.view === "trash";
  const mode: ViewMode = normalizedQuery.state.activeMode ?? "memo";
  const favoriteOnly = isTrashView
    ? false
    : mode === "memo"
      ? normalizedQuery.state.favoriteMemo
      : normalizedQuery.state.favoriteNote;

  const listCondition = React.useMemo<PostsListCondition>(
    () =>
      normalizePostsListCondition({
        view: normalizedQuery.state.view,
        favoriteOnly,
      }),
    [favoriteOnly, normalizedQuery.state.view]
  );

  const queryKey = React.useMemo(() => postsListQueryKey(listCondition), [listCondition]);
  const listQuery = usePostsInfiniteQuery(listCondition, { enabled: !normalizedQuery.changed });

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
  const [selectedTrashPostIds, setSelectedTrashPostIds] = React.useState<Set<string>>(() => new Set());
  const [deleteDialogMode, setDeleteDialogMode] = React.useState<"selected" | "all" | null>(null);

  const [isRestoringScroll, setIsRestoringScroll] = React.useState(false);
  const restoredScrollKeyRef = React.useRef<string | null>(null);
  const skipCleanupScrollKeyRef = React.useRef<string | null>(null);
  const isPopstateNavigationRef = React.useRef(false);
  const hasUserScrolledRef = React.useRef(false);
  const isProgrammaticScrollRef = React.useRef(false);
  const loadMoreSentinelElementRef = React.useRef<HTMLDivElement | null>(null);

  const visibleItems = React.useMemo(() => flattenInfiniteItems(listQuery.data), [listQuery.data]);
  const posts = React.useMemo(() => (isTrashView ? [] : visibleItems), [isTrashView, visibleItems]);
  const trashPosts = React.useMemo(() => (isTrashView ? visibleItems : []), [isTrashView, visibleItems]);

  const initialErrorMessage =
    !listQuery.data && listQuery.isError ? toErrorMessage(listQuery.error) : null;
  const nextPageErrorMessage =
    !!listQuery.data && listQuery.isFetchNextPageError ? toErrorMessage(listQuery.error) : null;

  const isInitialLoading = !listQuery.data && (listQuery.isLoading || listQuery.isFetching);
  const isNextPageLoading = listQuery.isFetchingNextPage;
  const scrollStorageKey = React.useMemo(() => getScrollStorageKey(listCondition), [listCondition]);

  const saveCurrentScroll = React.useCallback(() => {
    skipCleanupScrollKeyRef.current = scrollStorageKey;
    saveScrollPosition(listCondition);
  }, [listCondition, scrollStorageKey]);

  React.useEffect(() => {
    const handlePopState = () => {
      isPopstateNavigationRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [scrollStorageKey]);

  React.useEffect(() => {
    if (!normalizedQuery.changed) {
      return;
    }

    saveCurrentScroll();
    router.replace(toRootPath(normalizedQuery.nextQuery));
  }, [normalizedQuery.changed, normalizedQuery.nextQuery, router, saveCurrentScroll]);

  React.useEffect(() => {
    restoredScrollKeyRef.current = null;
    hasUserScrolledRef.current = false;
  }, [scrollStorageKey]);

  React.useEffect(() => {
    if (normalizedQuery.changed || !listQuery.data) {
      return;
    }

    if (restoredScrollKeyRef.current === scrollStorageKey) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    setIsRestoringScroll(true);

    return restoreScrollPosition(listCondition, () => {
      restoredScrollKeyRef.current = scrollStorageKey;
      hasUserScrolledRef.current = false;
      setIsRestoringScroll(false);
      window.requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    });
  }, [listCondition, listQuery.data, normalizedQuery.changed, scrollStorageKey]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isRestoringScroll || isPopstateNavigationRef.current || isProgrammaticScrollRef.current) {
        return;
      }

      hasUserScrolledRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isRestoringScroll]);

  React.useEffect(() => {
    return () => {
      if (skipCleanupScrollKeyRef.current === scrollStorageKey) {
        skipCleanupScrollKeyRef.current = null;
        isPopstateNavigationRef.current = false;
        return;
      }

      if (isPopstateNavigationRef.current) {
        const stored = readScrollPosition(listCondition);
        if (
          !hasUserScrolledRef.current &&
          window.scrollY === 0 &&
          stored !== null &&
          stored > 0
        ) {
          isPopstateNavigationRef.current = false;
          return;
        }
      }

      saveScrollPosition(listCondition);
      isPopstateNavigationRef.current = false;
      if (hasUserScrolledRef.current) {
        hasUserScrolledRef.current = false;
      }
    };
  }, [listCondition, scrollStorageKey]);

  React.useEffect(() => {
    if (!initialErrorMessage) {
      return;
    }

    toast.error(initialErrorMessage);
  }, [initialErrorMessage]);

  React.useEffect(() => {
    if (!nextPageErrorMessage) {
      return;
    }

    toast.error(nextPageErrorMessage);
  }, [nextPageErrorMessage]);

  const loadMoreSentinelRef = React.useCallback((element: HTMLDivElement | null) => {
    loadMoreSentinelElementRef.current = element;
  }, []);

  React.useEffect(() => {
    const target = loadMoreSentinelElementRef.current;

    if (
      !target ||
      !listQuery.hasNextPage ||
      isRestoringScroll ||
      normalizedQuery.changed ||
      Boolean(nextPageErrorMessage)
    ) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const shouldLoad = entries.some((entry) => entry.isIntersecting);
      if (
        !shouldLoad ||
        listQuery.isFetchingNextPage ||
        !listQuery.hasNextPage ||
        isRestoringScroll ||
        Boolean(nextPageErrorMessage)
      ) {
        return;
      }

      void listQuery.fetchNextPage();
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    isRestoringScroll,
    listQuery,
    listQuery.fetchNextPage,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    nextPageErrorMessage,
    normalizedQuery.changed,
  ]);

  const updateCurrentQueryItems = React.useCallback(
    (updater: (items: PostRecord[]) => PostRecord[]) => {
      let updated = false;

      queryClient.setQueryData<PostsInfiniteData>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        updated = true;
        const nextItems = updater(flattenInfiniteItems(current));
        return rebuildInfiniteData(current, nextItems);
      });

      return updated;
    },
    [queryClient, queryKey]
  );

  const updateAllCachedPostLists = React.useCallback(
    (updater: (condition: PostsListCondition, items: PostRecord[]) => PostRecord[]) => {
      let updatedCount = 0;

      const entries = queryClient.getQueriesData<PostsInfiniteData>({ queryKey: ["posts"] });
      for (const [key, data] of entries) {
        if (!data) {
          continue;
        }

        const condition = parsePostsListConditionFromQueryKey(key);
        if (!condition) {
          continue;
        }

        queryClient.setQueryData<PostsInfiniteData>(key, (current) => {
          if (!current) {
            return current;
          }

          const nextItems = updater(condition, flattenInfiniteItems(current));
          return rebuildInfiniteData(current, nextItems);
        });
        updatedCount += 1;
      }

      return updatedCount;
    },
    [queryClient]
  );

  const findInCachedPostLists = React.useCallback((postId: string): PostRecord | null => {
    const entries = queryClient.getQueriesData<PostsInfiniteData>({ queryKey: ["posts"] });
    for (const [, data] of entries) {
      if (!data) {
        continue;
      }

      const found = flattenInfiniteItems(data).find((post) => post.id === postId);
      if (found) {
        return found;
      }
    }

    return null;
  }, [queryClient]);

  const handleFavoriteFilterToggle = React.useCallback(() => {
    const next = buildQueryForFavoriteToggle(queryString);
    if (!next.changed) {
      return;
    }

    saveCurrentScroll();
    router.push(toRootPath(next.nextQuery));
  }, [queryString, router, saveCurrentScroll]);

  const handleModeChange = React.useCallback(
    (nextMode: ViewMode) => {
      const next = buildQueryForViewChange(queryString, nextMode);
      if (!next.changed) {
        return;
      }

      saveCurrentScroll();
      router.push(toRootPath(next.nextQuery));
    },
    [queryString, router, saveCurrentScroll]
  );

  const handleTrashClick = React.useCallback(() => {
    const next = buildQueryForViewChange(queryString, "trash");
    if (!next.changed) {
      return;
    }

    saveCurrentScroll();
    router.push(toRootPath(next.nextQuery));
  }, [queryString, router, saveCurrentScroll]);

  React.useEffect(() => {
    if (!isTrashView) {
      setSelectedTrashPostIds(new Set());
    }
  }, [isTrashView]);

  const handleToggleFavorite = React.useCallback(
    async (postId: string) => {
      const target = visibleItems.find((post) => post.id === postId);
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

      updateCurrentQueryItems((items) =>
        items.flatMap((post) => {
          if (post.id !== result.data.id) {
            return [post];
          }

          if (favoriteOnly && !result.data.favorite) {
            return [];
          }

          return [{ ...post, favorite: result.data.favorite }];
        })
      );
    },
    [favoriteOnly, updateCurrentQueryItems, visibleItems]
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
      const changed = updateCurrentQueryItems((items) =>
        upsertForCurrentView(items, updated, normalizedQuery.state.view, favoriteOnly)
      );

      if (!changed) {
        void queryClient.invalidateQueries({ queryKey: queryKey, exact: true });
      }
    },
    [favoriteOnly, normalizedQuery.state.view, queryClient, queryKey, updateCurrentQueryItems]
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

  const handleMoveToTrash = React.useCallback(
    async (postId: string) => {
      const result = await moveToTrashAction({ postId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const targetPost = visibleItems.find((post) => post.id === postId) ?? findInCachedPostLists(postId);
      const movedPost: PostRecord | null = targetPost
        ? {
            ...targetPost,
            trashedAt: targetPost.trashedAt ?? formatNowDate(),
          }
        : null;

      updateAllCachedPostLists((condition, items) => {
        if (condition.view === "trash") {
          if (!movedPost) {
            return items;
          }

          return [movedPost, ...items.filter((post) => post.id !== postId)].sort(sortByTrashedAtDesc);
        }

        return items.filter((post) => post.id !== postId);
      });

      if (editingMemoPostId === postId) {
        setEditingMemoPostId(null);
        setEditingMemoValue("");
      }
      toast("投稿を削除しました");
    },
    [editingMemoPostId, findInCachedPostLists, updateAllCachedPostLists, visibleItems]
  );

  const handleRestoreTrashPostStub = React.useCallback(
    async (postId: string) => {
      const result = await restoreFromTrashAction({ postId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const trashPost =
        visibleItems.find((post) => post.id === postId) ?? findInCachedPostLists(postId);
      const restoredPost: PostRecord | null = trashPost
        ? {
            ...trashPost,
            trashedAt: undefined,
          }
        : null;

      updateAllCachedPostLists((condition, items) => {
        if (condition.view === "trash") {
          return items.filter((post) => post.id !== postId);
        }

        if (!restoredPost || restoredPost.mode !== condition.view) {
          return items.filter((post) => post.id !== postId);
        }

        const shouldShow = !condition.favoriteOnly || restoredPost.favorite;
        if (!shouldShow) {
          return items.filter((post) => post.id !== postId);
        }

        return [restoredPost, ...items.filter((post) => post.id !== postId)].sort(sortByCreatedAtDesc);
      });
      setSelectedTrashPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
      toast("投稿を復元しました");
    },
    [findInCachedPostLists, updateAllCachedPostLists, visibleItems]
  );

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
            isInitialLoading={isInitialLoading}
            isNextPageLoading={isNextPageLoading}
            hasNextPage={Boolean(listQuery.hasNextPage)}
            initialErrorMessage={initialErrorMessage}
            nextPageErrorMessage={nextPageErrorMessage}
            onRetryInitialLoad={() => {
              void listQuery.refetch();
            }}
            onRetryNextPageLoad={() => {
              void listQuery.fetchNextPage();
            }}
            loadMoreSentinelRef={loadMoreSentinelRef}
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
