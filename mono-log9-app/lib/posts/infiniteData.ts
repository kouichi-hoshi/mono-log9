import type { InfiniteData } from "@tanstack/react-query";
import type { ListPostsResult, PostRecord } from "@/lib/posts/types";

export type PostsInfiniteData = InfiniteData<ListPostsResult, string | undefined>;

export function flattenInfiniteItems(data: PostsInfiniteData | undefined): PostRecord[] {
  if (!data) {
    return [];
  }

  return data.pages.flatMap((page) => page.items);
}

export function rebuildInfiniteData(current: PostsInfiniteData, nextItems: PostRecord[]): PostsInfiniteData {
  if (current.pages.length === 0) {
    return {
      pageParams: [undefined],
      pages: [{ items: nextItems, hasNext: false, nextCursor: null }],
    };
  }

  const pageSizes = current.pages.map((page) => page.items.length);
  const lastPage = current.pages[current.pages.length - 1];
  const capacity = pageSizes.reduce((sum, size) => sum + size, 0);
  const fittedItems =
    lastPage?.hasNext === true && capacity > 0 ? nextItems.slice(0, capacity) : nextItems;

  let offset = 0;
  const pages = current.pages.map((page, index) => {
    const isLast = index === current.pages.length - 1;
    const remaining = Math.max(fittedItems.length - offset, 0);
    const size = isLast ? remaining : Math.min(pageSizes[index], remaining);
    const items = fittedItems.slice(offset, offset + size);
    offset += size;

    return {
      ...page,
      items,
    };
  });

  return {
    ...current,
    pages,
  };
}
