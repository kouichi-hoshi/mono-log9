import { useInfiniteQuery } from "@tanstack/react-query";
import { listPostsAction } from "@/app/actions/postActions";
import type { PostsInfiniteData } from "@/lib/posts/infiniteData";
import { postsListQueryKey, type PostsListCondition } from "@/lib/posts/queryKeys";
import type { ListPostsResult } from "@/lib/posts/types";

const PAGE_SIZE = 10;
const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 30 * 60 * 1000;

export class PostsListQueryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PostsListQueryError";
    this.code = code;
  }
}

type UsePostsInfiniteQueryOptions = {
  enabled?: boolean;
  expectedActorUserId?: string;
};

export function usePostsInfiniteQuery(
  condition: PostsListCondition,
  options: UsePostsInfiniteQueryOptions = {}
) {
  const expectedActorUserId = options.expectedActorUserId;
  return useInfiniteQuery<ListPostsResult, PostsListQueryError, PostsInfiniteData, ReturnType<typeof postsListQueryKey>, string | undefined>({
    queryKey: postsListQueryKey(condition),
    enabled: options.enabled ?? true,
    initialPageParam: undefined,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ pageParam }) => {
      const result = await listPostsAction({
        view: condition.view,
        favoriteOnly: condition.favoriteOnly,
        limit: PAGE_SIZE,
        cursor: pageParam,
        expectedActorUserId,
      });

      if (!result.ok) {
        throw new PostsListQueryError(result.error.code, result.error.message);
      }

      return result.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
