"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  createPostAction,
  deleteTrashPostsAction,
  emptyTrashAction,
  moveToTrashAction,
  restoreFromTrashAction,
  setFavoriteAction,
  type ActionError,
  updatePostAction,
} from "@/app/actions/postActions";
import ControlledLoginDialog from "@/components/auth/ControlledLoginDialog";
import Container1 from "@/components/authed/Container1";
import Container2 from "@/components/authed/Container2";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal from "@/components/authed/NoteComposerModal";
import type { AuthedUser, ViewMode } from "@/components/authed/stubs";
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
  buildQueryForNoteComposerClose,
  buildQueryForNoteComposerOpen,
  buildQueryForViewChange,
  normalizeAuthedQuery,
  toRootPath,
} from "@/lib/authedQueryState";
import { buildCallbackPathFromQueryString } from "@/lib/auth/callbackUrl";
import { signOutToRoot } from "@/lib/auth/client";
import { cleanupAfterLogout } from "@/lib/auth/logoutCleanup";
import {
  clearReloginDraft,
  loadReloginDraft,
  saveReloginDraft,
  type ReloginNoteDraft,
} from "@/lib/auth/reloginDraft";
import type { AuthMode } from "@/lib/auth/types";
import { clonePostContent, createDocFromPlainText } from "@/lib/posts/content";
import { formatJstDateTime, parseDisplayJstDateTimeToEpochMs } from "@/lib/posts/dateTime";
import { isMemoDirty } from "@/lib/posts/hasEdits";
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
import { comparePostsByCreatedAtDesc, comparePostsByTrashedAtDesc } from "@/lib/posts/sort";
import {
  getScrollStorageKey,
  readScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
} from "@/lib/posts/scrollRestoration";
import type { PostContent, PostRecord, PostView } from "@/lib/posts/types";
import { PostsListQueryError, usePostsInfiniteQuery } from "@/lib/posts/usePostsInfiniteQuery";
import { buildUrlWithStubAuthFromQuery } from "@/lib/stubAuth";
import { APP_NAME } from "@/lib/appMeta";

type AuthedScreenProps = {
  authMode?: AuthMode;
  user?: AuthedUser;
};

type PendingAction =
  | {
      type: "query";
      nextQuery: string;
      method: "push" | "replace";
    }
  | {
      type: "openMemoEdit";
      postId: string;
      initialValue: string;
    }
  | {
      type: "closeMemoEdit";
    };

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

    return [updated, ...items.filter((item) => item.id !== updated.id)].sort(
      comparePostsByTrashedAtDesc
    );
  }

  const isVisibleModePost = updated.mode === view && typeof updated.trashedAt === "undefined";
  const canDisplay = isVisibleModePost && (!favoriteOnly || updated.favorite);

  if (!canDisplay) {
    return items.filter((item) => item.id !== updated.id);
  }

  return [updated, ...items.filter((item) => item.id !== updated.id)].sort(
    comparePostsByCreatedAtDesc
  );
}

function formatNowDate(): string {
  return formatJstDateTime(new Date());
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

export default function AuthedScreen({
  authMode = "stub",
  user = { name: "テストユーザー", handle: "@mono-log", imageUrl: null },
}: AuthedScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const queryString = searchParams.toString();
  const loginCallbackUrl = React.useMemo(
    () =>
      authMode === "stub"
        ? buildUrlWithStubAuthFromQuery(queryString)
        : buildCallbackPathFromQueryString(queryString),
    [authMode, queryString]
  );
  const committedQueryRef = React.useRef(queryString);
  const [committedQueryString, setCommittedQueryString] = React.useState(queryString);
  const previousQueryRef = React.useRef(queryString);
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
  const [editingMemoInitialValue, setEditingMemoInitialValue] = React.useState("");

  const noteComposer = normalizedQuery.state.noteComposer;
  const [noteModalMode, setNoteModalMode] = React.useState<"create" | "edit">("create");
  const [noteModalInitialTitle, setNoteModalInitialTitle] = React.useState("");
  const [noteModalInitialContent, setNoteModalInitialContent] = React.useState<PostContent | null>(
    null
  );
  const [noteModalInitialPlainText, setNoteModalInitialPlainText] = React.useState("");
  const [noteModalDirty, setNoteModalDirty] = React.useState(false);
  const committedQueryState = React.useMemo(
    () => normalizeAuthedQuery(committedQueryString).state,
    [committedQueryString]
  );
  const shouldKeepNoteModalOpen =
    noteModalDirty &&
    queryString !== committedQueryString &&
    committedQueryState.view === "note" &&
    committedQueryState.noteComposer.mode !== "none";
  const isNoteModalOpen =
    (normalizedQuery.state.view === "note" && noteComposer.mode !== "none") || shouldKeepNoteModalOpen;
  const [editingNotePostId, setEditingNotePostId] = React.useState<string | null>(null);
  const [selectedTrashPostIds, setSelectedTrashPostIds] = React.useState<Set<string>>(() => new Set());
  const [deleteDialogMode, setDeleteDialogMode] = React.useState<"selected" | "all" | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);
  const [deleteDialogErrorMessage, setDeleteDialogErrorMessage] = React.useState<string | null>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = React.useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [liveNoteDraft, setLiveNoteDraft] = React.useState<ReloginNoteDraft | null>(null);
  const [restoredNoteDraft, setRestoredNoteDraft] = React.useState<ReloginNoteDraft | null>(null);

  const [isRestoringScroll, setIsRestoringScroll] = React.useState(false);
  const restoredScrollKeyRef = React.useRef<string | null>(null);
  const skipCleanupScrollKeyRef = React.useRef<string | null>(null);
  const isPopstateNavigationRef = React.useRef(false);
  const hasUserScrolledRef = React.useRef(false);
  const isProgrammaticScrollRef = React.useRef(false);
  const loadMoreSentinelElementRef = React.useRef<HTMLDivElement | null>(null);
  const handledInitialErrorKeyRef = React.useRef<string | null>(null);
  const handledNextPageErrorKeyRef = React.useRef<string | null>(null);
  const handledMissingNoteComposerRef = React.useRef<string | null>(null);
  const initializedNoteComposerRef = React.useRef<string | null>(null);
  const skipDiscardConfirmOnNextNoteCloseRef = React.useRef(false);

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

  const isMemoCreateDirty = memoDraft.length > 0;
  const isMemoEditDirty =
    editingMemoPostId !== null && isMemoDirty(editingMemoInitialValue, editingMemoValue);
  const isNoteEditDirty = noteModalDirty;
  const hasUnsavedEdits = isMemoCreateDirty || isMemoEditDirty || isNoteEditDirty;

  const closeNoteModalNow = React.useCallback(() => {
    setNoteModalMode("create");
    setNoteModalInitialTitle("");
    setNoteModalInitialContent(null);
    setNoteModalInitialPlainText("");
    setEditingNotePostId(null);
    setNoteModalDirty(false);
  }, []);

  const discardCurrentEdits = React.useCallback(() => {
    setMemoDraft("");
    setEditingMemoPostId(null);
    setEditingMemoValue("");
    setEditingMemoInitialValue("");
    closeNoteModalNow();
  }, [closeNoteModalNow]);

  const persistReloginDraft = React.useCallback(() => {
    if (authMode !== "authjs") {
      return;
    }

    try {
      saveReloginDraft({
        query: queryString,
        memoDraft,
        editingMemoPostId,
        editingMemoValue,
        noteDraft: liveNoteDraft,
      });
    } catch {
      // Storage failures are non-fatal; continue relogin flow.
    }
  }, [
    authMode,
    editingMemoPostId,
    editingMemoValue,
    liveNoteDraft,
    memoDraft,
    queryString,
  ]);

  const syncCommittedQuery = React.useCallback((nextQuery: string) => {
    committedQueryRef.current = nextQuery;
    setCommittedQueryString(nextQuery);
  }, []);

  const executeAction = React.useCallback(
    (action: PendingAction) => {
      switch (action.type) {
        case "query": {
          saveCurrentScroll();
          syncCommittedQuery(action.nextQuery);
          if (action.method === "push") {
            router.push(toRootPath(action.nextQuery));
            return;
          }
          router.replace(toRootPath(action.nextQuery));
          return;
        }
        case "openMemoEdit": {
          setEditingMemoPostId(action.postId);
          setEditingMemoInitialValue(action.initialValue);
          setEditingMemoValue(action.initialValue);
          return;
        }
        case "closeMemoEdit": {
          setEditingMemoPostId(null);
          setEditingMemoInitialValue("");
          setEditingMemoValue("");
          return;
        }
      }
    },
    [router, saveCurrentScroll, syncCommittedQuery]
  );

  const runOrConfirm = React.useCallback(
    (action: PendingAction) => {
      if (hasUnsavedEdits) {
        setPendingAction(action);
        setIsDiscardDialogOpen(true);
        return;
      }

      executeAction(action);
    },
    [executeAction, hasUnsavedEdits]
  );

  const handleLogout = React.useCallback(async () => {
    if (isLogoutSubmitting) {
      return;
    }

    setIsLogoutSubmitting(true);

    try {
      if (authMode === "authjs") {
        const redirectUrl = await signOutToRoot();
        cleanupAfterLogout(queryClient);
        router.push(redirectUrl);
        return;
      }

      cleanupAfterLogout(queryClient);
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
      setIsLogoutSubmitting(false);
      return;
    }

    setIsLogoutSubmitting(false);
  }, [authMode, isLogoutSubmitting, queryClient, router]);

  const handleActionError = React.useCallback((error: ActionError | { code: string; message: string }) => {
    if (error.code === "UNAUTHORIZED") {
      toast.error(error.message || "ログインが必要です");
      persistReloginDraft();
      setIsLoginDialogOpen(true);
      return;
    }

    if (error.code === "INTERNAL_ERROR" || error.code === "NOT_IMPLEMENTED") {
      toast.error(error.message || "サーバーエラーが発生しました");
      return;
    }

    toast.error(error.message);
  }, [persistReloginDraft]);

  React.useEffect(() => {
    if (authMode !== "authjs") {
      return;
    }

    const restored = loadReloginDraft();
    if (!restored || restored.query !== queryString) {
      return;
    }

    setMemoDraft(restored.memoDraft);
    if (restored.editingMemoPostId) {
      setEditingMemoPostId(restored.editingMemoPostId);
      setEditingMemoInitialValue(restored.editingMemoValue);
      setEditingMemoValue(restored.editingMemoValue);
    }

    setRestoredNoteDraft(restored.noteDraft);
    clearReloginDraft();
  }, [authMode, queryString]);

  React.useEffect(() => {
    const handlePopState = () => {
      isPopstateNavigationRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  React.useEffect(() => {
    if (!normalizedQuery.changed) {
      return;
    }

    syncCommittedQuery(normalizedQuery.nextQuery);
    previousQueryRef.current = normalizedQuery.nextQuery;
    saveCurrentScroll();
    router.replace(toRootPath(normalizedQuery.nextQuery));
  }, [normalizedQuery.changed, normalizedQuery.nextQuery, router, saveCurrentScroll, syncCommittedQuery]);

  React.useEffect(() => {
    if (normalizedQuery.changed) {
      return;
    }

    const previousQuery = previousQueryRef.current;
    if (previousQuery === queryString) {
      return;
    }
    previousQueryRef.current = queryString;

    const isPopstateNavigation = isPopstateNavigationRef.current;
    isPopstateNavigationRef.current = false;

    if (!hasUnsavedEdits) {
      syncCommittedQuery(queryString);
      return;
    }

    const committedQuery = committedQueryString;
    if (queryString === committedQuery) {
      return;
    }

    setPendingAction({
      type: "query",
      nextQuery: queryString,
      method: "replace",
    });
    setIsDiscardDialogOpen(true);

    if (isPopstateNavigation || queryString !== committedQuery) {
      router.replace(toRootPath(committedQuery));
    }
  }, [committedQueryString, hasUnsavedEdits, normalizedQuery.changed, queryString, router, syncCommittedQuery]);

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
    if (!listQuery.isError || listQuery.data) {
      handledInitialErrorKeyRef.current = null;
      return;
    }

    const code = listQuery.error?.code ?? "INTERNAL_ERROR";
    const message = initialErrorMessage ?? listQuery.error?.message ?? "エラーが発生しました";
    const signature = `${code}:${message}`;
    if (handledInitialErrorKeyRef.current === signature) {
      return;
    }

    handledInitialErrorKeyRef.current = signature;
    handleActionError({ code, message });
  }, [handleActionError, initialErrorMessage, listQuery.data, listQuery.error, listQuery.isError]);

  React.useEffect(() => {
    if (!listQuery.isFetchNextPageError || !listQuery.data) {
      handledNextPageErrorKeyRef.current = null;
      return;
    }

    const code = listQuery.error?.code ?? "INTERNAL_ERROR";
    const message = nextPageErrorMessage ?? listQuery.error?.message ?? "エラーが発生しました";
    const signature = `${code}:${message}`;
    if (handledNextPageErrorKeyRef.current === signature) {
      return;
    }

    handledNextPageErrorKeyRef.current = signature;
    handleActionError({ code, message });
  }, [
    handleActionError,
    listQuery.data,
    listQuery.error,
    listQuery.isFetchNextPageError,
    nextPageErrorMessage,
  ]);

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

    runOrConfirm({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [queryString, runOrConfirm]);

  const handleModeChange = React.useCallback(
    (nextMode: ViewMode) => {
      const next = buildQueryForViewChange(queryString, nextMode);
      if (!next.changed) {
        return;
      }

      runOrConfirm({
        type: "query",
        method: "push",
        nextQuery: next.nextQuery,
      });
    },
    [queryString, runOrConfirm]
  );

  const handleTrashClick = React.useCallback(() => {
    const next = buildQueryForViewChange(queryString, "trash");
    if (!next.changed) {
      return;
    }

    runOrConfirm({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [queryString, runOrConfirm]);

  React.useEffect(() => {
    if (!isTrashView) {
      setSelectedTrashPostIds(new Set());
    }
  }, [isTrashView]);

  React.useEffect(() => {
    if (!isNoteModalOpen) {
      if (noteModalDirty) {
        return;
      }

      handledMissingNoteComposerRef.current = null;
      initializedNoteComposerRef.current = null;
      closeNoteModalNow();
      return;
    }

    if (noteComposer.mode === "create") {
      if (initializedNoteComposerRef.current === "create") {
        if (restoredNoteDraft && !noteModalDirty) {
          setNoteModalInitialTitle(restoredNoteDraft.title);
          setNoteModalInitialContent(restoredNoteDraft.contentJson);
          setNoteModalInitialPlainText(restoredNoteDraft.plainText);
          setNoteModalDirty(false);
          setRestoredNoteDraft(null);
          return;
        }
        return;
      }

      initializedNoteComposerRef.current = "create";
      handledMissingNoteComposerRef.current = null;
      setNoteModalMode("create");
      setEditingNotePostId(null);
      setNoteModalInitialTitle(restoredNoteDraft?.title ?? "");
      setNoteModalInitialContent(restoredNoteDraft?.contentJson ?? null);
      setNoteModalInitialPlainText(restoredNoteDraft?.plainText ?? "");
      setNoteModalDirty(false);
      if (restoredNoteDraft) {
        setRestoredNoteDraft(null);
      }
      return;
    }

    if (noteComposer.mode !== "edit") {
      return;
    }

    const targetPost =
      visibleItems.find((post) => post.id === noteComposer.postId) ??
      findInCachedPostLists(noteComposer.postId);

    if (!targetPost && !listQuery.data && listQuery.isFetching) {
      return;
    }

    if (
      !targetPost ||
      targetPost.mode !== "note" ||
      typeof targetPost.trashedAt !== "undefined"
    ) {
      const signature = `${noteComposer.mode}:${noteComposer.postId}`;
      if (handledMissingNoteComposerRef.current === signature) {
        return;
      }

      handledMissingNoteComposerRef.current = signature;
      toast.error("対象が見つかりません");
      const next = buildQueryForNoteComposerClose(queryString);
      syncCommittedQuery(next.nextQuery);
      router.replace(toRootPath(next.nextQuery));
      return;
    }

    const initializedSignature = `edit:${targetPost.id}`;
    if (initializedNoteComposerRef.current === initializedSignature) {
      return;
    }

    initializedNoteComposerRef.current = initializedSignature;
    handledMissingNoteComposerRef.current = null;
    setNoteModalMode("edit");
    setEditingNotePostId(targetPost.id);
    setNoteModalInitialTitle(restoredNoteDraft?.title ?? targetPost.title ?? "");
    setNoteModalInitialContent(
      restoredNoteDraft?.contentJson ?? clonePostContent(targetPost.content)
    );
    setNoteModalInitialPlainText(restoredNoteDraft?.plainText ?? targetPost.contentText);
    setNoteModalDirty(false);
    if (restoredNoteDraft) {
      setRestoredNoteDraft(null);
    }
  }, [
    closeNoteModalNow,
    findInCachedPostLists,
    isNoteModalOpen,
    listQuery.data,
    listQuery.isFetching,
    noteModalDirty,
    noteComposer,
    queryString,
    restoredNoteDraft,
    router,
    syncCommittedQuery,
    visibleItems,
  ]);

  const syncFavoriteInCurrentViewCaches = React.useCallback(
    (updated: PostRecord) => {
      const entries = queryClient.getQueriesData<PostsInfiniteData>({ queryKey: ["posts"] });
      let syncedCount = 0;

      for (const [key, data] of entries) {
        if (!data) {
          continue;
        }

        const condition = parsePostsListConditionFromQueryKey(key);
        if (!condition || condition.view !== updated.mode) {
          continue;
        }

        queryClient.setQueryData<PostsInfiniteData>(key, (current) => {
          if (!current) {
            return current;
          }

          const nextItems = upsertForCurrentView(
            flattenInfiniteItems(current),
            updated,
            condition.view,
            condition.favoriteOnly
          );
          return rebuildInfiniteData(current, nextItems);
        });
        syncedCount += 1;
      }

      if (syncedCount === 0) {
        void queryClient.invalidateQueries({ queryKey: queryKey, exact: true });
      }
    },
    [queryClient, queryKey]
  );

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
        handleActionError(result.error);
        return;
      }

      syncFavoriteInCurrentViewCaches(result.data);
    },
    [handleActionError, syncFavoriteInCurrentViewCaches, visibleItems]
  );

  const handleOpenNoteCreate = React.useCallback(() => {
    const next = buildQueryForNoteComposerOpen(queryString, { mode: "create" });
    if (!next.changed) {
      return;
    }

    runOrConfirm({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [queryString, runOrConfirm]);

  const handleEdit = React.useCallback(
    (postId: string) => {
      const target = posts.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      if (target.mode === "memo") {
        runOrConfirm({
          type: "openMemoEdit",
          postId,
          initialValue: target.contentText,
        });
        return;
      }

      const next = buildQueryForNoteComposerOpen(queryString, {
        mode: "edit",
        postId,
      });
      if (!next.changed) {
        return;
      }

      runOrConfirm({
        type: "query",
        method: "push",
        nextQuery: next.nextQuery,
      });
    },
    [posts, queryString, runOrConfirm]
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

  const removePostsFromAllCaches = React.useCallback(
    (postIds: string[]) => {
      if (postIds.length === 0) {
        return;
      }

      const removeSet = new Set(postIds);
      updateAllCachedPostLists((_, items) => items.filter((post) => !removeSet.has(post.id)));
    },
    [updateAllCachedPostLists]
  );

  const handleMemoSaveStub = React.useCallback(
    async (value: string) => {
      const result = await createPostAction({
        mode: "memo",
        content: createDocFromPlainText(value),
      });

      if (!result.ok) {
        handleActionError(result.error);
        return false;
      }

      upsertPostInVisibleList(result.data);
      setMemoDraft("");
      toast("保存しました");
      return true;
    },
    [handleActionError, upsertPostInVisibleList]
  );

  const handleMemoEditSaveStub = React.useCallback(
    async (postId: string, value: string) => {
      const result = await updatePostAction({
        postId,
        content: createDocFromPlainText(value),
      });

      if (!result.ok) {
        handleActionError(result.error);
        return false;
      }

      upsertPostInVisibleList(result.data);
      setEditingMemoPostId(null);
      setEditingMemoInitialValue("");
      setEditingMemoValue("");
      toast("更新しました");
      return true;
    },
    [handleActionError, upsertPostInVisibleList]
  );

  const handleMemoEditCancel = React.useCallback(() => {
    runOrConfirm({ type: "closeMemoEdit" });
  }, [runOrConfirm]);

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
        handleActionError(result.error);
        return false;
      }

      upsertPostInVisibleList(result.data);
      toast(noteModalMode === "edit" ? "更新しました" : "保存しました");
      setNoteModalDirty(false);
      skipDiscardConfirmOnNextNoteCloseRef.current = true;

      if (noteModalMode === "edit") {
        setNoteModalMode("create");
        setEditingNotePostId(null);
      }

      return true;
    },
    [editingNotePostId, handleActionError, noteModalMode, upsertPostInVisibleList]
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
    setDeleteDialogErrorMessage(null);
    setDeleteDialogMode("selected");
  }, [selectedTrashPostIds]);

  const handleRequestEmptyTrash = React.useCallback(() => {
    if (trashPosts.length === 0) {
      return;
    }
    setDeleteDialogErrorMessage(null);
    setDeleteDialogMode("all");
  }, [trashPosts.length]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleteDialogMode || isDeleteSubmitting) {
      return;
    }

    setIsDeleteSubmitting(true);
    setDeleteDialogErrorMessage(null);

    if (deleteDialogMode === "selected") {
      const postIds = Array.from(selectedTrashPostIds);
      const result = await deleteTrashPostsAction({ postIds });
      if (!result.ok) {
        handleActionError(result.error);
        setDeleteDialogErrorMessage(result.error.message);
        setIsDeleteSubmitting(false);
        return;
      }

      removePostsFromAllCaches(result.data.deletedPostIds);
      setSelectedTrashPostIds((current) => {
        const next = new Set(current);
        for (const postId of result.data.deletedPostIds) {
          next.delete(postId);
        }
        return next;
      });
      toast("投稿を完全に削除しました");
      setDeleteDialogMode(null);
      setIsDeleteSubmitting(false);
      return;
    }

    const result = await emptyTrashAction();
    if (!result.ok) {
      handleActionError(result.error);
      setDeleteDialogErrorMessage(result.error.message);
      setIsDeleteSubmitting(false);
      return;
    }

    updateAllCachedPostLists((condition, items) => {
      if (condition.view === "trash") {
        return [];
      }

      return items.filter((post) => typeof post.trashedAt === "undefined");
    });
    setSelectedTrashPostIds(new Set());
    toast("投稿を完全に削除しました");
    setDeleteDialogMode(null);
    setIsDeleteSubmitting(false);
  }, [
    deleteDialogMode,
    handleActionError,
    isDeleteSubmitting,
    removePostsFromAllCaches,
    selectedTrashPostIds,
    updateAllCachedPostLists,
  ]);

  const handleDeleteDialogOpenChange = React.useCallback((open: boolean) => {
    if (isDeleteSubmitting) {
      return;
    }

    if (!open) {
      setDeleteDialogMode(null);
      setDeleteDialogErrorMessage(null);
    }
  }, [isDeleteSubmitting]);

  const handleDiscardDialogOpenChange = React.useCallback((open: boolean) => {
    setIsDiscardDialogOpen(open);
    if (!open) {
      setPendingAction(null);
    }
  }, []);

  const handleDiscardAndContinue = React.useCallback(() => {
    const action = pendingAction;
    setIsDiscardDialogOpen(false);
    setPendingAction(null);
    discardCurrentEdits();
    if (action) {
      executeAction(action);
    }
  }, [discardCurrentEdits, executeAction, pendingAction]);

  const handleNoteModalOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      return;
    }

    const next = buildQueryForNoteComposerClose(queryString);
    if (skipDiscardConfirmOnNextNoteCloseRef.current) {
      skipDiscardConfirmOnNextNoteCloseRef.current = false;
      if (next.changed) {
        executeAction({
          type: "query",
          method: "push",
          nextQuery: next.nextQuery,
        });
      }
      return;
    }

    if (!next.changed) {
      return;
    }

    runOrConfirm({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [executeAction, queryString, runOrConfirm]);

  const handleNoteModalRequestClose = React.useCallback(() => {
    const next = buildQueryForNoteComposerClose(queryString);
    if (!next.changed) {
      return;
    }

    runOrConfirm({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [queryString, runOrConfirm]);

  const handleMoveToTrash = React.useCallback(
    async (postId: string) => {
      const result = await moveToTrashAction({ postId });
      if (!result.ok) {
        handleActionError(result.error);
        return;
      }

      const targetPost = visibleItems.find((post) => post.id === postId) ?? findInCachedPostLists(postId);
      const trashedAt = targetPost?.trashedAt ?? formatNowDate();
      const trashedAtEpochMs =
        parseDisplayJstDateTimeToEpochMs(trashedAt) ?? parseDisplayJstDateTimeToEpochMs(formatNowDate());
      const movedPost: PostRecord | null = targetPost
        ? {
            ...targetPost,
            trashedAt,
            trashedAtEpochMs: trashedAtEpochMs ?? Date.now(),
          }
        : null;

      updateAllCachedPostLists((condition, items) => {
        if (condition.view === "trash") {
          if (!movedPost) {
            return items;
          }

          return [movedPost, ...items.filter((post) => post.id !== postId)].sort(
            comparePostsByTrashedAtDesc
          );
        }

        return items.filter((post) => post.id !== postId);
      });

      if (editingMemoPostId === postId) {
        setEditingMemoPostId(null);
        setEditingMemoInitialValue("");
        setEditingMemoValue("");
      }
      toast("投稿を削除しました");
    },
    [editingMemoPostId, findInCachedPostLists, handleActionError, updateAllCachedPostLists, visibleItems]
  );

  const handleRestoreTrashPostStub = React.useCallback(
    async (postId: string) => {
      const result = await restoreFromTrashAction({ postId });
      if (!result.ok) {
        handleActionError(result.error);
        return;
      }

      const trashPost =
        visibleItems.find((post) => post.id === postId) ?? findInCachedPostLists(postId);
      const restoredPost: PostRecord | null = trashPost
        ? {
            ...trashPost,
            trashedAt: undefined,
            trashedAtEpochMs: undefined,
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

        return [restoredPost, ...items.filter((post) => post.id !== postId)].sort(
          comparePostsByCreatedAtDesc
        );
      });
      setSelectedTrashPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
      toast("投稿を復元しました");
    },
    [findInCachedPostLists, handleActionError, updateAllCachedPostLists, visibleItems]
  );

  const handlePermanentDeleteTrashPost = React.useCallback(
    async (postId: string) => {
      const result = await deleteTrashPostsAction({ postIds: [postId] });
      if (!result.ok) {
        handleActionError(result.error);
        return;
      }

      removePostsFromAllCaches(result.data.deletedPostIds);
      setSelectedTrashPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
      toast("投稿を完全に削除しました");
    },
    [handleActionError, removePostsFromAllCaches]
  );

  return (
    <div className="min-h-screen pb-4 md:pb-12 text-foreground bg-blue-50">
      <header className="sticky top-0 mb-6 md:mb-12">
        <h1 className="sr-only">{APP_NAME}</h1>
        <div className="border-b-2 bg-white/80 px-4 py-4">
          <div className="mx-auto w-full max-w-6xl">
            <Container1
              user={user}
              mode={mode}
              view={isTrashView ? "trash" : "list"}
              onLogout={handleLogout}
              isLogoutSubmitting={isLogoutSubmitting}
              onModeChange={handleModeChange}
              onTrashClick={handleTrashClick}
            />
          </div>
        </div>
      </header>
      <div className="rounded-xl p-4 mx-4 md:mx-auto md:max-w-8/10 md:p-12 lg:p-18 xl:max-w-4xl bg-white">
        {!isTrashView && (
          <section>
            <HeaderPostArea
              viewMode={mode}
              onNoteComposeClick={handleOpenNoteCreate}
              memoDraft={memoDraft}
              onMemoDraftChange={setMemoDraft}
              onMemoSaveStub={handleMemoSaveStub}
            />
            <hr className="border border-foreground/10 my-4 md:my-12" />
          </section>
        )}
        <main>
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
              onPermanentDeleteTrashPostStub={handlePermanentDeleteTrashPost}
            />
          </article>
        </main>
      </div>
      <NoteComposerModal
        open={isNoteModalOpen}
        onOpenChange={handleNoteModalOpenChange}
        mode={noteModalMode}
        initialTitle={noteModalInitialTitle}
        initialContentJson={noteModalInitialContent}
        initialPlainText={noteModalInitialPlainText}
        onSaveStub={handleNoteSaveStub}
        onDirtyChange={setNoteModalDirty}
        onDraftChange={setLiveNoteDraft}
        onRequestClose={handleNoteModalRequestClose}
      />
      <ControlledLoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        authMode={authMode}
        callbackUrl={loginCallbackUrl}
        onBeforeAuthRedirect={persistReloginDraft}
      />
      <AlertDialog open={isDiscardDialogOpen} onOpenChange={handleDiscardDialogOpenChange}>
        <AlertDialogContent className="z-70">
          <AlertDialogHeader>
            <AlertDialogTitle>編集中の内容があります。破棄して続行しますか？</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              編集中の内容を破棄して続行するか確認します
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardAndContinue}>破棄して続行</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteDialogMode !== null} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent className="z-70">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialogMode === "selected"
                ? `${selectedTrashPostIds.size}件の投稿を完全に削除しますか?`
                : "ごみ箱内のすべての投稿を完全に削除しますか?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogErrorMessage ?? "この操作は取り消せません"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteSubmitting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleteSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {isDeleteSubmitting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <footer className="hidden">© {APP_NAME}</footer>
    </div>
  );
}
