export type PageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(searchParams: PageSearchParams | undefined): URLSearchParams {
  const params = new URLSearchParams();

  if (!searchParams) {
    return params;
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "undefined") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.append(key, value);
  }

  return params;
}

function toPathname(params: URLSearchParams): string {
  const query = params.toString();
  return query.length > 0 ? `/?${query}` : "/";
}

export function stripStubAuth(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete("stubAuth");
  return next;
}

export function buildCallbackPathFromSearchParams(
  searchParams: PageSearchParams | undefined
): string {
  const params = toUrlSearchParams(searchParams);
  return toPathname(stripStubAuth(params));
}

export function buildCallbackPathFromQueryString(queryString: string): string {
  const normalized = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(normalized);
  return toPathname(stripStubAuth(params));
}
