export type PageSearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(searchParams: PageSearchParams | undefined) {
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

export function isStubAuthed(
  searchParams: PageSearchParams | undefined,
  enabled: boolean
): boolean {
  if (!enabled) {
    return false;
  }

  const value = searchParams?.stubAuth;
  if (Array.isArray(value)) {
    return value.includes("1");
  }

  return value === "1";
}

export function buildUrlWithStubAuth(
  searchParams: PageSearchParams | undefined
): string {
  const params = toUrlSearchParams(searchParams);
  params.set("stubAuth", "1");
  return toPathname(params);
}

export function buildUrlWithoutStubAuth(
  searchParams: PageSearchParams | undefined
): string {
  const params = toUrlSearchParams(searchParams);
  params.delete("stubAuth");
  return toPathname(params);
}
