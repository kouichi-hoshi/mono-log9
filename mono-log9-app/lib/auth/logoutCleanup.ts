import type { QueryClient } from "@tanstack/react-query";

const SCROLL_STORAGE_PREFIX = "mono-log:scroll:v1:";

export function clearPostsQueryCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: ["posts"] });
}

export function clearScrollRestorationStorage(storage?: Storage): void {
  if (typeof window === "undefined") {
    return;
  }

  const target = storage ?? window.sessionStorage;
  const keysToRemove: string[] = [];

  for (let index = 0; index < target.length; index += 1) {
    const key = target.key(index);
    if (key?.startsWith(SCROLL_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    target.removeItem(key);
  }
}

export function cleanupAfterLogout(queryClient: QueryClient): void {
  clearPostsQueryCache(queryClient);
  clearScrollRestorationStorage();
}
