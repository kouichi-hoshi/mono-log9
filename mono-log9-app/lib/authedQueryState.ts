export type QueryView = "memo" | "note" | "trash";

type ActiveMode = "memo" | "note" | null;

export type AuthedQueryState = {
  view: QueryView;
  activeMode: ActiveMode;
  favoriteMemo: boolean;
  favoriteNote: boolean;
};

export type QueryBuildResult = {
  nextQuery: string;
  changed: boolean;
  state: AuthedQueryState;
};

type ParsedQuery = {
  unknownEntries: Array<[string, string]>;
  state: AuthedQueryState;
  meta: {
    viewCount: number;
    firstViewRaw: string | undefined;
    favoriteMemoCount: number;
    favoriteNoteCount: number;
  };
};

const VIEW_KEY = "view";
const FAVORITE_MEMO_KEY = "favoriteMemo";
const FAVORITE_NOTE_KEY = "favoriteNote";

function normalizeView(value: string | undefined): QueryView {
  if (value === "memo" || value === "note" || value === "trash") {
    return value;
  }

  return "memo";
}

function toActiveMode(view: QueryView): ActiveMode {
  if (view === "trash") {
    return null;
  }

  return view;
}

function parseQuery(query: string): ParsedQuery {
  const params = new URLSearchParams(query);

  const viewValues: string[] = [];
  let favoriteMemoCount = 0;
  let favoriteNoteCount = 0;
  const unknownEntries: Array<[string, string]> = [];

  for (const [key, value] of params.entries()) {
    if (key === VIEW_KEY) {
      viewValues.push(value);
      continue;
    }

    if (key === FAVORITE_MEMO_KEY) {
      favoriteMemoCount += 1;
      continue;
    }

    if (key === FAVORITE_NOTE_KEY) {
      favoriteNoteCount += 1;
      continue;
    }

    unknownEntries.push([key, value]);
  }

  const view = normalizeView(viewValues[0]);

  return {
    unknownEntries,
    state: {
      view,
      activeMode: toActiveMode(view),
      favoriteMemo: favoriteMemoCount > 0,
      favoriteNote: favoriteNoteCount > 0,
    },
    meta: {
      viewCount: viewValues.length,
      firstViewRaw: viewValues[0],
      favoriteMemoCount,
      favoriteNoteCount,
    },
  };
}

function toQueryString(
  unknownEntries: Array<[string, string]>,
  state: AuthedQueryState
): string {
  const params = new URLSearchParams();

  for (const [key, value] of unknownEntries) {
    params.append(key, value);
  }

  params.set(VIEW_KEY, state.view);

  if (state.favoriteMemo) {
    params.append(FAVORITE_MEMO_KEY, "");
  }

  if (state.favoriteNote) {
    params.append(FAVORITE_NOTE_KEY, "");
  }

  return params.toString();
}

export function normalizeAuthedQuery(query: string): QueryBuildResult {
  const parsed = parseQuery(query);
  const shouldNormalize =
    parsed.meta.viewCount === 0 ||
    parsed.meta.viewCount > 1 ||
    parsed.meta.favoriteMemoCount > 1 ||
    parsed.meta.favoriteNoteCount > 1 ||
    normalizeView(parsed.meta.firstViewRaw) !== parsed.meta.firstViewRaw;

  const nextQuery = shouldNormalize
    ? toQueryString(parsed.unknownEntries, parsed.state)
    : query;

  return {
    nextQuery,
    changed: shouldNormalize,
    state: parsed.state,
  };
}

export function buildQueryForViewChange(
  query: string,
  nextView: QueryView
): QueryBuildResult {
  const normalized = normalizeAuthedQuery(query);
  const parsed = parseQuery(normalized.nextQuery);

  if (parsed.state.view === nextView) {
    return {
      nextQuery: normalized.nextQuery,
      changed: false,
      state: parsed.state,
    };
  }

  const nextState: AuthedQueryState = {
    ...parsed.state,
    view: nextView,
    activeMode: toActiveMode(nextView),
  };

  const nextQuery = toQueryString(parsed.unknownEntries, nextState);

  return {
    nextQuery,
    changed: true,
    state: nextState,
  };
}

export function buildQueryForFavoriteToggle(query: string): QueryBuildResult {
  const normalized = normalizeAuthedQuery(query);
  const parsed = parseQuery(normalized.nextQuery);

  if (parsed.state.view === "trash") {
    return {
      nextQuery: normalized.nextQuery,
      changed: false,
      state: parsed.state,
    };
  }

  const nextState: AuthedQueryState =
    parsed.state.view === "memo"
      ? { ...parsed.state, favoriteMemo: !parsed.state.favoriteMemo }
      : { ...parsed.state, favoriteNote: !parsed.state.favoriteNote };

  const nextQuery = toQueryString(parsed.unknownEntries, nextState);

  return {
    nextQuery,
    changed: true,
    state: nextState,
  };
}

export function toRootPath(query: string): string {
  return query.length > 0 ? `/?${query}` : "/";
}
