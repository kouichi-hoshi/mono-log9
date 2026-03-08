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
import DiscardConfirmDialog from "@/components/authed/DiscardConfirmDialog";
import HeaderPostArea from "@/components/authed/HeaderPostArea";
import NoteComposerModal, { EMPTY_DRAFT } from "@/components/authed/NoteComposerModal";
import PostsSection from "@/components/authed/PostsSection";
import TrashDeleteDialog from "@/components/authed/TrashDeleteDialog";
import type { AuthedUser, ViewMode } from "@/components/authed/stubs";
import type { NoteDraft } from "@/components/authed/types";
import { useGuardedQueryNavigation } from "@/components/authed/useGuardedQueryNavigation";
import { useInfiniteLoadMore } from "@/components/authed/useInfiniteLoadMore";
import { useNoteComposerState } from "@/components/authed/useNoteComposerState";
import { useOptimisticViewState } from "@/components/authed/useOptimisticViewState";
import { usePostsScrollRestoration } from "@/components/authed/usePostsScrollRestoration";
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
import {
  cleanupAfterLogout,
  clearPostsQueryCache,
  clearScrollRestorationStorage,
} from "@/lib/auth/logoutCleanup";
import {
  clearReloginDraft,
  loadReloginDraft,
  saveReloginDraft,
  type ReloginNoteDraft,
} from "@/lib/auth/reloginDraft";
import type { AuthMode } from "@/lib/auth/types";
import { clonePostContent, createDocFromPlainText } from "@/lib/posts/content";
import { formatJstDateTime, parseDisplayJstDateTimeToEpochMs } from "@/lib/posts/dateTime";
import {
  applyDeletePostsMutation,
  applyFavoriteMutation,
  applyMoveToTrashMutation,
  applyRestoreFromTrashMutation,
  upsertForCurrentView,
} from "@/lib/posts/cacheMutations";
import { isMemoDirty, isNoteDirty } from "@/lib/posts/hasEdits";
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
import { getScrollStorageKey } from "@/lib/posts/scrollRestoration";
import type { PostRecord } from "@/lib/posts/types";
import { PostsListQueryError, usePostsInfiniteQuery } from "@/lib/posts/usePostsInfiniteQuery";
import { buildUrlWithStubAuthFromQuery } from "@/lib/stubAuth";
import { APP_NAME } from "@/lib/appMeta";

type AuthedScreenProps = {
  authMode?: AuthMode;
  user?: AuthedUser;
};

const DEFAULT_AUTHED_USER: AuthedUser = {
  name: "テストユーザー",
  handle: "@mono-log",
  imageUrl: null,
};

function useLatestRef<T>(value: T) {
  const valueRef = React.useRef(value);
  React.useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);
  return valueRef;
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

function formatNowDate(): string {
  return formatJstDateTime(new Date());
}

function cloneNoteDraft(draft: NoteDraft): NoteDraft {
  return {
    title: draft.title,
    contentJson: draft.contentJson ? clonePostContent(draft.contentJson) : null,
    plainText: draft.plainText,
  };
}

function noteDraftFromPost(post: PostRecord): NoteDraft {
  return {
    title: post.title ?? "",
    contentJson: clonePostContent(post.content),
    plainText: post.contentText,
  };
}

function getNoteDraftSessionKey(queryString: string): string | null {
  const normalized = normalizeAuthedQuery(queryString).state;
  if (normalized.view !== "note") {
    return null;
  }
  if (normalized.noteComposer.mode === "create") {
    return "create";
  }
  if (normalized.noteComposer.mode === "edit" && normalized.noteComposer.postId) {
    return `edit:${normalized.noteComposer.postId}`;
  }
  return null;
}

function canonicalizeQueryString(queryString: string): string {
  return new URLSearchParams(queryString).toString();
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
  const actorScopeRaw = (condition as { actorScope?: unknown }).actorScope;
  if (view !== "memo" && view !== "note" && view !== "trash") {
    return null;
  }

  if (typeof favoriteOnly !== "boolean") {
    return null;
  }

  const actorScope =
    typeof actorScopeRaw === "string" && actorScopeRaw.trim().length > 0
      ? actorScopeRaw
      : "legacy";
  return normalizePostsListCondition({ view, favoriteOnly, actorScope });
}

export default function AuthedScreen({
  authMode = "stub",
  user = DEFAULT_AUTHED_USER,
}: AuthedScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const queryString = searchParams.toString();
  const expectedActorUserId =
    authMode === "authjs" && typeof user.actorUserId === "string" && user.actorUserId.trim().length > 0
      ? user.actorUserId.trim()
      : undefined;
  const actorScope = expectedActorUserId ? `actor:${expectedActorUserId}` : authMode === "authjs" ? "actor:missing" : "stub";
  const expectedActorUserIdRef = useLatestRef(expectedActorUserId);
  const lastSessionCheckAtRef = React.useRef(0);
  const isSessionCheckInFlightRef = React.useRef(false);
  const rawNormalizedQuery = React.useMemo(() => normalizeAuthedQuery(queryString), [queryString]);
  const loginCallbackUrl = React.useMemo(
    () =>
      authMode === "stub"
        ? buildUrlWithStubAuthFromQuery(queryString)
        : buildCallbackPathFromQueryString(queryString),
    [authMode, queryString]
  );
  const [memoDraft, setMemoDraft] = React.useState("");
  const [editingMemoPostId, setEditingMemoPostId] = React.useState<string | null>(null);
  const [editingMemoValue, setEditingMemoValue] = React.useState("");
  const [editingMemoInitialValue, setEditingMemoInitialValue] = React.useState("");

  const [noteDraft, setNoteDraft] = React.useState<NoteDraft>(() => ({ ...EMPTY_DRAFT }));
  const [noteBaselineDraft, setNoteBaselineDraft] = React.useState<NoteDraft>(() => ({
    ...EMPTY_DRAFT,
  }));
  const lastNoteDraftSeedKeyRef = React.useRef<string | null>(null);
  const restoredNoteDraftAppliedKeyRef = React.useRef<string | null>(null);
  const [selectedTrashPostIds, setSelectedTrashPostIds] = React.useState<Set<string>>(() => new Set());
  const [deleteDialogMode, setDeleteDialogMode] = React.useState<"selected" | "all" | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);
  const [deleteDialogErrorMessage, setDeleteDialogErrorMessage] = React.useState<string | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = React.useState(false);
  const [restoredNoteDraft, setRestoredNoteDraft] = React.useState<ReloginNoteDraft | null>(null);
  const [hasLoadedReloginDraft, setHasLoadedReloginDraft] = React.useState(authMode !== "authjs");
  const liveNoteDraftRef = React.useRef<ReloginNoteDraft | null>(null);
  const memoDraftRef = useLatestRef(memoDraft);
  const editingMemoPostIdRef = useLatestRef(editingMemoPostId);
  const editingMemoValueRef = useLatestRef(editingMemoValue);

  const handledInitialErrorKeyRef = React.useRef<string | null>(null);
  const handledNextPageErrorKeyRef = React.useRef<string | null>(null);
  const skipDiscardConfirmOnNextNoteCloseRef = React.useRef(false);
  const saveCurrentScrollRef = React.useRef<() => void>(() => {});

  const saveCurrentScroll = React.useCallback(() => {
    saveCurrentScrollRef.current();
  }, []);

  const isMemoCreateDirty = memoDraft.length > 0;
  const isMemoEditDirty =
    editingMemoPostId !== null && isMemoDirty(editingMemoInitialValue, editingMemoValue);
  const isNoteEditDirty = isNoteDirty(
    { title: noteBaselineDraft.title, content: noteBaselineDraft.contentJson },
    { title: noteDraft.title, content: noteDraft.contentJson }
  );
  const hasUnsavedEdits = isMemoCreateDirty || isMemoEditDirty || isNoteEditDirty;

  const closeNoteModalNow = React.useCallback(() => {
    setNoteDraft({ ...EMPTY_DRAFT });
    setNoteBaselineDraft({ ...EMPTY_DRAFT });
    lastNoteDraftSeedKeyRef.current = null;
    restoredNoteDraftAppliedKeyRef.current = null;
  }, []);

  const discardCurrentEdits = React.useCallback(() => {
    setMemoDraft("");
    setEditingMemoPostId(null);
    setEditingMemoValue("");
    setEditingMemoInitialValue("");
    setNoteDraft({ ...EMPTY_DRAFT });
    setNoteBaselineDraft({ ...EMPTY_DRAFT });
    lastNoteDraftSeedKeyRef.current = null;
    restoredNoteDraftAppliedKeyRef.current = null;
    closeNoteModalNow();
  }, [closeNoteModalNow]);

  const persistReloginDraft = React.useCallback(() => {
    if (authMode !== "authjs") {
      return;
    }

    try {
      saveReloginDraft({
        query: queryString,
        memoDraft: memoDraftRef.current,
        editingMemoPostId: editingMemoPostIdRef.current,
        editingMemoValue: editingMemoValueRef.current,
        noteDraft: liveNoteDraftRef.current,
      });
    } catch {
      // Storage failures are non-fatal; continue relogin flow.
    }
  }, [authMode, editingMemoPostIdRef, editingMemoValueRef, memoDraftRef, queryString]);

  const {
    effectiveQueryString,
    isDiscardDialogOpen,
    runOrConfirm,
    executeAction,
    syncCommittedQuery,
    handleDiscardDialogOpenChange,
    handleDiscardAndContinue,
  } = useGuardedQueryNavigation({
    queryString,
    hasUnsavedEdits,
    router,
    saveCurrentScroll,
    onOpenMemoEdit: (postId, initialValue) => {
      setEditingMemoPostId(postId);
      setEditingMemoInitialValue(initialValue);
      setEditingMemoValue(initialValue);
    },
    onCloseMemoEdit: () => {
      setEditingMemoPostId(null);
      setEditingMemoInitialValue("");
      setEditingMemoValue("");
    },
    onDiscardEdits: discardCurrentEdits,
  });
  const effectiveQueryStringRef = useLatestRef(effectiveQueryString);
  const {
    displayQueryString,
    applyOptimisticView,
  } = useOptimisticViewState({
    effectiveQueryString,
    hasUnsavedEdits,
    syncTimeoutMs: 4000,
    onSyncTimeout: () => {
      toast.error("画面の切り替えに失敗しました。もう一度お試しください。");
    },
  });
  const runOrConfirmRef = useLatestRef(runOrConfirm);
  const executeActionRef = useLatestRef(executeAction);

  const normalizedQuery = React.useMemo(
    () => normalizeAuthedQuery(effectiveQueryString),
    [effectiveQueryString]
  );
  const displayNormalizedQuery = React.useMemo(
    () => normalizeAuthedQuery(displayQueryString),
    [displayQueryString]
  );
  const displayIsTrashView = displayNormalizedQuery.state.view === "trash";
  const displayMode: ViewMode = displayNormalizedQuery.state.activeMode ?? "memo";
  const isTrashView = normalizedQuery.state.view === "trash";
  const mode: ViewMode = normalizedQuery.state.activeMode ?? "memo";
  const favoriteOnly = isTrashView
    ? false
    : mode === "memo"
      ? normalizedQuery.state.favoriteMemo
      : normalizedQuery.state.favoriteNote;
  const noteComposer = normalizedQuery.state.noteComposer;
  const isNoteModalOpen = normalizedQuery.state.view === "note" && noteComposer.mode !== "none";
  const listCondition = React.useMemo<PostsListCondition>(
    () =>
      normalizePostsListCondition({
        view: normalizedQuery.state.view,
        favoriteOnly,
        actorScope,
      }),
    [actorScope, favoriteOnly, normalizedQuery.state.view]
  );
  const queryKey = React.useMemo(() => postsListQueryKey(listCondition), [listCondition]);
  const listQuery = usePostsInfiniteQuery(listCondition, {
    enabled: !rawNormalizedQuery.changed,
    expectedActorUserId,
  });
  const visibleItems = React.useMemo(() => flattenInfiniteItems(listQuery.data), [listQuery.data]);
  const posts = React.useMemo(() => (isTrashView ? [] : visibleItems), [isTrashView, visibleItems]);
  const trashPosts = React.useMemo(() => (isTrashView ? visibleItems : []), [isTrashView, visibleItems]);
  const postsRef = useLatestRef(posts);
  const initialErrorMessage =
    !listQuery.data && listQuery.isError ? toErrorMessage(listQuery.error) : null;
  const nextPageErrorMessage =
    !!listQuery.data && listQuery.isFetchNextPageError ? toErrorMessage(listQuery.error) : null;
  const isInitialLoading = !listQuery.data && (listQuery.isLoading || listQuery.isFetching);
  const isNextPageLoading = listQuery.isFetchingNextPage;
  const scrollStorageKey = React.useMemo(() => getScrollStorageKey(listCondition), [listCondition]);
  const { isRestoringScroll, saveCurrentScroll: saveCurrentScrollFromHook } =
    usePostsScrollRestoration({
      listCondition,
      scrollStorageKey,
      listReady: Boolean(listQuery.data),
      isQueryNormalizing: rawNormalizedQuery.changed,
    });
  const { loadMoreSentinelRef } = useInfiniteLoadMore({
    hasNextPage: Boolean(listQuery.hasNextPage),
    isFetchingNextPage: listQuery.isFetchingNextPage,
    isRestoringScroll,
    hasNextPageError: Boolean(nextPageErrorMessage),
    isQueryNormalizing: rawNormalizedQuery.changed,
    fetchNextPage: listQuery.fetchNextPage,
  });
  const retryInitialLoadRef = useLatestRef(listQuery.refetch);
  const retryNextPageLoadRef = useLatestRef(listQuery.fetchNextPage);

  const handleRetryInitialLoad = React.useCallback(() => {
    void retryInitialLoadRef.current();
  }, [retryInitialLoadRef]);

  const handleRetryNextPageLoad = React.useCallback(() => {
    void retryNextPageLoadRef.current();
  }, [retryNextPageLoadRef]);

  React.useLayoutEffect(() => {
    saveCurrentScrollRef.current = saveCurrentScrollFromHook;
    return () => {
      saveCurrentScrollRef.current = () => {};
    };
  }, [saveCurrentScrollFromHook]);

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
      setHasLoadedReloginDraft(true);
      return;
    }

    const restored = loadReloginDraft();
    if (
      restored &&
      canonicalizeQueryString(restored.query) === canonicalizeQueryString(queryString)
    ) {
      setMemoDraft(restored.memoDraft);
      if (restored.editingMemoPostId) {
        setEditingMemoPostId(restored.editingMemoPostId);
        setEditingMemoInitialValue(restored.editingMemoValue);
        setEditingMemoValue(restored.editingMemoValue);
      }

      const restoredNoteSessionKey = getNoteDraftSessionKey(queryString);
      if (restored.noteDraft && restoredNoteSessionKey) {
        const restoredDraft = cloneNoteDraft(restored.noteDraft);
        setNoteBaselineDraft(restoredDraft);
        setNoteDraft(cloneNoteDraft(restoredDraft));
        lastNoteDraftSeedKeyRef.current = restoredNoteSessionKey;
        restoredNoteDraftAppliedKeyRef.current = restoredNoteSessionKey;
        setRestoredNoteDraft(null);
      } else {
        setRestoredNoteDraft(restored.noteDraft);
      }
      clearReloginDraft();
    }

    setHasLoadedReloginDraft(true);
  }, [authMode, queryString]);

  React.useEffect(() => {
    if (!rawNormalizedQuery.changed) {
      return;
    }

    executeAction({
      type: "query",
      nextQuery: rawNormalizedQuery.nextQuery,
      method: "replace",
    });
  }, [executeAction, rawNormalizedQuery.changed, rawNormalizedQuery.nextQuery]);

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

  const getFavoriteModeConditions = React.useCallback(
    (targetMode: ViewMode) =>
      [
        normalizePostsListCondition({
          view: targetMode,
          favoriteOnly: false,
          actorScope: listCondition.actorScope,
        }),
        normalizePostsListCondition({
          view: targetMode,
          favoriteOnly: true,
          actorScope: listCondition.actorScope,
        }),
      ] as const,
    [listCondition.actorScope]
  );

  const findPostInModeCaches = React.useCallback((postId: string, targetMode: ViewMode): PostRecord | null => {
    const conditions = getFavoriteModeConditions(targetMode);
    for (const condition of conditions) {
      const data = queryClient.getQueryData<PostsInfiniteData>(postsListQueryKey(condition));
      if (!data) {
        continue;
      }

      const found = flattenInfiniteItems(data).find((post) => post.id === postId);
      if (found) {
        return found;
      }
    }

    return null;
  }, [getFavoriteModeConditions, queryClient]);

  const invalidateFavoriteModeCaches = React.useCallback(
    (targetMode: ViewMode) => {
      const conditions = getFavoriteModeConditions(targetMode);
      for (const condition of conditions) {
        void queryClient.invalidateQueries({
          queryKey: postsListQueryKey(condition),
          exact: true,
        });
      }
    },
    [getFavoriteModeConditions, queryClient]
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

  const handleMissingNoteComposerTarget = React.useCallback((nextQuery: string) => {
    toast.error("対象が見つかりません");
    syncCommittedQuery(nextQuery);
    router.replace(toRootPath(nextQuery));
  }, [router, syncCommittedQuery]);

  const consumeRestoredNoteDraft = React.useCallback(() => {
    setRestoredNoteDraft(null);
  }, []);

  const {
    mode: noteModalMode,
    editingNotePostId,
    sessionKey: noteDraftSeedKey,
    resolvedDraft,
    missingTargetNextQuery,
    shouldConsumeRestoredDraft,
  } = useNoteComposerState({
    effectiveQueryString,
    noteComposer,
    isNoteModalOpen,
    visibleItems,
    restoredNoteDraft,
    listState: {
      hasData: Boolean(listQuery.data),
      isFetching: listQuery.isFetching,
    },
    findInCachedPostLists,
  });

  const handledMissingTargetRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!missingTargetNextQuery) {
      handledMissingTargetRef.current = null;
      return;
    }
    if (handledMissingTargetRef.current === missingTargetNextQuery) {
      return;
    }
    handledMissingTargetRef.current = missingTargetNextQuery;
    handleMissingNoteComposerTarget(missingTargetNextQuery);
  }, [handleMissingNoteComposerTarget, missingTargetNextQuery]);

  const hasHandledCloseRef = React.useRef(false);
  React.useEffect(() => {
    if (isNoteModalOpen) {
      hasHandledCloseRef.current = false;
      return;
    }
    if (isNoteEditDirty) {
      return;
    }
    if (hasHandledCloseRef.current) {
      return;
    }
    hasHandledCloseRef.current = true;
    closeNoteModalNow();
  }, [closeNoteModalNow, isNoteModalOpen, isNoteEditDirty]);

  React.useEffect(() => {
    liveNoteDraftRef.current = isNoteModalOpen ? noteDraft : null;
  }, [isNoteModalOpen, noteDraft]);

  React.useEffect(() => {
    if (!hasLoadedReloginDraft) {
      return;
    }
    if (!isNoteModalOpen || !noteDraftSeedKey) {
      if (!isNoteModalOpen) {
        lastNoteDraftSeedKeyRef.current = null;
        restoredNoteDraftAppliedKeyRef.current = null;
      }
      return;
    }
    if (!resolvedDraft) {
      return;
    }

    const hasSeededCurrentSession = lastNoteDraftSeedKeyRef.current === noteDraftSeedKey;
    const shouldApplyRestoredSeed =
      shouldConsumeRestoredDraft && restoredNoteDraftAppliedKeyRef.current !== noteDraftSeedKey;
    if (hasSeededCurrentSession && !shouldApplyRestoredSeed) {
      return;
    }

    lastNoteDraftSeedKeyRef.current = noteDraftSeedKey;
    setNoteBaselineDraft(cloneNoteDraft(resolvedDraft));
    setNoteDraft(cloneNoteDraft(resolvedDraft));
    if (shouldConsumeRestoredDraft) {
      restoredNoteDraftAppliedKeyRef.current = noteDraftSeedKey;
      consumeRestoredNoteDraft();
    }
  }, [
    consumeRestoredNoteDraft,
    hasLoadedReloginDraft,
    isNoteModalOpen,
    noteDraftSeedKey,
    resolvedDraft,
    shouldConsumeRestoredDraft,
  ]);

  const handleFavoriteFilterToggle = React.useCallback(() => {
    const next = buildQueryForFavoriteToggle(effectiveQueryStringRef.current);
    if (!next.changed) {
      return;
    }

    runOrConfirmRef.current({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [effectiveQueryStringRef, runOrConfirmRef]);

  const handleModeChange = React.useCallback(
    (nextMode: ViewMode) => {
      const next = buildQueryForViewChange(effectiveQueryStringRef.current, nextMode);
      if (!next.changed) {
        return;
      }

      try {
        runOrConfirmRef.current({
          type: "query",
          method: "push",
          nextQuery: next.nextQuery,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "画面の切り替えに失敗しました。もう一度お試しください。");
        return;
      }

      if (!hasUnsavedEdits) {
        applyOptimisticView(nextMode, next.nextQuery);
      }
    },
    [applyOptimisticView, effectiveQueryStringRef, hasUnsavedEdits, runOrConfirmRef]
  );

  React.useEffect(() => {
    if (authMode !== "authjs") {
      return;
    }
    if (!expectedActorUserId) {
      return;
    }

    const checkSessionActor = async () => {
      const now = Date.now();
      if (now - lastSessionCheckAtRef.current < 10_000) {
        return;
      }
      if (isSessionCheckInFlightRef.current) {
        return;
      }

      lastSessionCheckAtRef.current = now;
      isSessionCheckInFlightRef.current = true;
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as {
          user?: { actorUserId?: string | null } | null;
        };
        const currentActorUserId =
          typeof body?.user?.actorUserId === "string" ? body.user.actorUserId.trim() : "";
        const expected = expectedActorUserIdRef.current ?? "";
        if (!currentActorUserId || currentActorUserId !== expected) {
          clearPostsQueryCache(queryClient);
          clearScrollRestorationStorage();
          handleActionError({
            code: "UNAUTHORIZED",
            message: "ログイン状態が変更されました。再ログインしてください",
          });
        }
      } catch {
        // Ignore transient session polling failures.
      } finally {
        isSessionCheckInFlightRef.current = false;
      }
    };

    const onFocus = () => {
      void checkSessionActor();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void checkSessionActor();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authMode, expectedActorUserId, expectedActorUserIdRef, handleActionError, queryClient]);

  const handleTrashClick = React.useCallback(() => {
    const next = buildQueryForViewChange(effectiveQueryStringRef.current, "trash");
    if (!next.changed) {
      return;
    }

    try {
      runOrConfirmRef.current({
        type: "query",
        method: "push",
        nextQuery: next.nextQuery,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "画面の切り替えに失敗しました。もう一度お試しください。");
      return;
    }

    if (!hasUnsavedEdits) {
      applyOptimisticView("trash", next.nextQuery);
    }
  }, [applyOptimisticView, effectiveQueryStringRef, hasUnsavedEdits, runOrConfirmRef]);

  React.useEffect(() => {
    if (!isTrashView) {
      setSelectedTrashPostIds(new Set());
    }
  }, [isTrashView]);

  const syncFavoriteInModeCaches = React.useCallback(
    (updated: PostRecord) => {
      const targetConditions = getFavoriteModeConditions(updated.mode);
      let syncedCount = 0;

      for (const condition of targetConditions) {
        const targetQueryKey = postsListQueryKey(condition);
        queryClient.setQueryData<PostsInfiniteData>(targetQueryKey, (current) => {
          if (!current) {
            return current;
          }

          syncedCount += 1;
          const nextItems = applyFavoriteMutation(
            {
              condition,
              items: flattenInfiniteItems(current),
            },
            updated
          );
          return rebuildInfiniteData(current, nextItems);
        });
      }

      if (syncedCount > 0) {
        return;
      }

      invalidateFavoriteModeCaches(updated.mode);
    },
    [getFavoriteModeConditions, invalidateFavoriteModeCaches, queryClient]
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
        expectedActorUserId,
      });

      if (!result.ok) {
        handleActionError(result.error);
        return;
      }

      const latest = findPostInModeCaches(postId, target.mode);
      if (!latest) {
        invalidateFavoriteModeCaches(target.mode);
        return;
      }

      const updatedPost: PostRecord = {
        ...latest,
        favorite: result.data.favorite,
      };
      syncFavoriteInModeCaches(updatedPost);
    },
    [
      expectedActorUserId,
      findPostInModeCaches,
      handleActionError,
      invalidateFavoriteModeCaches,
      syncFavoriteInModeCaches,
      visibleItems,
    ]
  );

  const handleOpenNoteCreate = React.useCallback(() => {
    const next = buildQueryForNoteComposerOpen(effectiveQueryStringRef.current, { mode: "create" });
    if (!next.changed) {
      return;
    }

    runOrConfirmRef.current({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [effectiveQueryStringRef, runOrConfirmRef]);

  const handleEdit = React.useCallback(
    (postId: string) => {
      const target = postsRef.current.find((post) => post.id === postId);
      if (!target) {
        return;
      }

      if (target.mode === "memo") {
        runOrConfirmRef.current({
          type: "openMemoEdit",
          postId,
          initialValue: target.contentText,
        });
        return;
      }

      const next = buildQueryForNoteComposerOpen(effectiveQueryStringRef.current, {
        mode: "edit",
        postId,
      });
      if (!next.changed) {
        return;
      }

      runOrConfirmRef.current({
        type: "query",
        method: "push",
        nextQuery: next.nextQuery,
      });
    },
    [effectiveQueryStringRef, postsRef, runOrConfirmRef]
  );

  const upsertPostInVisibleList = React.useCallback(
    (updated: PostRecord) => {
      const changed = updateCurrentQueryItems((items) =>
        upsertForCurrentView(
          {
            condition: listCondition,
            items,
          },
          updated
        )
      );

      if (!changed) {
        void queryClient.invalidateQueries({ queryKey: queryKey, exact: true });
      }
    },
    [listCondition, queryClient, queryKey, updateCurrentQueryItems]
  );

  const removePostsFromAllCaches = React.useCallback(
    (postIds: string[]) => {
      if (postIds.length === 0) {
        return;
      }

      updateAllCachedPostLists((condition, items) =>
        applyDeletePostsMutation(
          {
            condition,
            items,
          },
          postIds
        )
      );
    },
    [updateAllCachedPostLists]
  );

  const handleMemoSaveStub = React.useCallback(
    async (value: string) => {
      const result = await createPostAction({
        mode: "memo",
        content: createDocFromPlainText(value),
        expectedActorUserId,
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
    [expectedActorUserId, handleActionError, upsertPostInVisibleList]
  );

  const handleMemoEditSaveStub = React.useCallback(
    async (postId: string, value: string) => {
      const result = await updatePostAction({
        postId,
        content: createDocFromPlainText(value),
        expectedActorUserId,
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
    [expectedActorUserId, handleActionError, upsertPostInVisibleList]
  );

  const handleMemoEditCancel = React.useCallback(() => {
    runOrConfirmRef.current({ type: "closeMemoEdit" });
  }, [runOrConfirmRef]);

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
              expectedActorUserId,
            })
          : await createPostAction({
              mode: "note",
              title: draft.title,
              content: serializedContent,
              expectedActorUserId,
            });

      if (!result.ok) {
        handleActionError(result.error);
        return false;
      }

      const savedDraft = noteDraftFromPost(result.data);
      setNoteBaselineDraft(savedDraft);
      setNoteDraft(cloneNoteDraft(savedDraft));
      upsertPostInVisibleList(result.data);
      toast(noteModalMode === "edit" ? "更新しました" : "保存しました");
      skipDiscardConfirmOnNextNoteCloseRef.current = true;

      return true;
    },
    [editingNotePostId, expectedActorUserId, handleActionError, noteModalMode, upsertPostInVisibleList]
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
      const result = await deleteTrashPostsAction({ postIds, expectedActorUserId });
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

    const result = await emptyTrashAction({ expectedActorUserId });
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
    expectedActorUserId,
    isDeleteSubmitting,
    removePostsFromAllCaches,
    selectedTrashPostIds,
    updateAllCachedPostLists,
  ]);
  const handleTrashDeleteConfirm = React.useCallback(() => {
    void handleConfirmDelete();
  }, [handleConfirmDelete]);

  const handleDeleteDialogOpenChange = React.useCallback((open: boolean) => {
    if (isDeleteSubmitting) {
      return;
    }

    if (!open) {
      setDeleteDialogMode(null);
      setDeleteDialogErrorMessage(null);
    }
  }, [isDeleteSubmitting]);

  const handleNoteModalOpenChange = React.useCallback((open: boolean) => {
    if (open) {
      return;
    }

    const next = buildQueryForNoteComposerClose(effectiveQueryStringRef.current);
    if (skipDiscardConfirmOnNextNoteCloseRef.current) {
      skipDiscardConfirmOnNextNoteCloseRef.current = false;
      if (next.changed) {
        executeActionRef.current({
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

    runOrConfirmRef.current({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [effectiveQueryStringRef, executeActionRef, runOrConfirmRef]);

  const handleNoteModalRequestClose = React.useCallback(() => {
    const next = buildQueryForNoteComposerClose(effectiveQueryStringRef.current);
    if (!next.changed) {
      return;
    }

    runOrConfirmRef.current({
      type: "query",
      method: "push",
      nextQuery: next.nextQuery,
    });
  }, [effectiveQueryStringRef, runOrConfirmRef]);

  const handleMoveToTrash = React.useCallback(
    async (postId: string) => {
      const result = await moveToTrashAction({ postId, expectedActorUserId });
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

      updateAllCachedPostLists((condition, items) =>
        applyMoveToTrashMutation(
          {
            condition,
            items,
          },
          {
            postId,
            movedPost,
          }
        )
      );

      if (editingMemoPostId === postId) {
        setEditingMemoPostId(null);
        setEditingMemoInitialValue("");
        setEditingMemoValue("");
      }
      toast("投稿を削除しました");
    },
    [
      editingMemoPostId,
      expectedActorUserId,
      findInCachedPostLists,
      handleActionError,
      updateAllCachedPostLists,
      visibleItems,
    ]
  );

  const handleRestoreTrashPostStub = React.useCallback(
    async (postId: string) => {
      const result = await restoreFromTrashAction({ postId, expectedActorUserId });
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

      updateAllCachedPostLists((condition, items) =>
        applyRestoreFromTrashMutation(
          {
            condition,
            items,
          },
          {
            postId,
            restoredPost,
          }
        )
      );
      setSelectedTrashPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
      toast("投稿を復元しました");
    },
    [expectedActorUserId, findInCachedPostLists, handleActionError, updateAllCachedPostLists, visibleItems]
  );

  const handlePermanentDeleteTrashPost = React.useCallback(
    async (postId: string) => {
      const result = await deleteTrashPostsAction({ postIds: [postId], expectedActorUserId });
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
    [expectedActorUserId, handleActionError, removePostsFromAllCaches]
  );

  return (
    <div className="min-h-screen pb-4 md:pb-12 text-foreground bg-blue-50">
      <header className="sticky top-0 mb-6 md:mb-12">
        <h1 className="sr-only">{APP_NAME}</h1>
        <div className="px-4 py-4 border-b-2 bg-white/80">
          <div className="mx-auto w-full max-w-6xl">
            <Container1
              user={user}
              mode={displayMode}
              view={displayIsTrashView ? "trash" : "list"}
              onLogout={handleLogout}
              isLogoutSubmitting={isLogoutSubmitting}
              onModeChange={handleModeChange}
              onTrashClick={handleTrashClick}
            />
          </div>
        </div>
      </header>
      <div className="mx-4 p-4 md:mx-auto md:max-w-8/10 md:p-12 lg:p-18 xl:max-w-4xl rounded-xl bg-white">
        {!isTrashView && (
          <section>
            <HeaderPostArea
              viewMode={mode}
              onNoteComposeClick={handleOpenNoteCreate}
              memoDraft={memoDraft}
              onMemoDraftChange={setMemoDraft}
              onMemoSaveStub={handleMemoSaveStub}
            />
            <hr className="my-4 md:my-12 border border-foreground/10" />
          </section>
        )}
        <PostsSection
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
          onRetryInitialLoad={handleRetryInitialLoad}
          onRetryNextPageLoad={handleRetryNextPageLoad}
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
      </div>
      <NoteComposerModal
        open={isNoteModalOpen}
        onOpenChange={handleNoteModalOpenChange}
        mode={noteModalMode}
        draft={noteDraft}
        onDraftChange={setNoteDraft}
        onSaveStub={handleNoteSaveStub}
        onRequestClose={handleNoteModalRequestClose}
        sessionKey={noteDraftSeedKey ?? undefined}
      />
      <ControlledLoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        authMode={authMode}
        callbackUrl={loginCallbackUrl}
        onBeforeAuthRedirect={persistReloginDraft}
      />
      <DiscardConfirmDialog
        open={isDiscardDialogOpen}
        onOpenChange={handleDiscardDialogOpenChange}
        onConfirm={handleDiscardAndContinue}
      />
      <TrashDeleteDialog
        open={deleteDialogMode !== null}
        mode={deleteDialogMode}
        selectedCount={selectedTrashPostIds.size}
        submitting={isDeleteSubmitting}
        errorMessage={deleteDialogErrorMessage}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleTrashDeleteConfirm}
      />
      <footer className="hidden">© {APP_NAME}</footer>
    </div>
  );
}
