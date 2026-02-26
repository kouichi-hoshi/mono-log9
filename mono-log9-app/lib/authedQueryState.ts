export type QueryView = "memo" | "note" | "trash";

type ActiveMode = "memo" | "note" | null;

export type NoteComposerState =
  | { mode: "none" }
  | { mode: "create" }
  | { mode: "edit"; postId: string };

export type AuthedQueryState = {
  view: QueryView;
  activeMode: ActiveMode;
  favoriteMemo: boolean;
  favoriteNote: boolean;
  noteComposer: NoteComposerState;
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
    noteComposerCount: number;
    firstNoteComposerRaw: string | undefined;
  };
};

const VIEW_KEY = "view";
const FAVORITE_MEMO_KEY = "favoriteMemo";
const FAVORITE_NOTE_KEY = "favoriteNote";
const NOTE_COMPOSER_KEY = "noteComposer";

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

function normalizeNoteComposer(value: string | undefined): NoteComposerState {
  if (value === "create") {
    return { mode: "create" };
  }

  if (value?.startsWith("edit:")) {
    const postId = value.slice("edit:".length).trim();
    if (postId.length > 0) {
      return { mode: "edit", postId };
    }
  }

  return { mode: "none" };
}

function noteComposerToParam(value: NoteComposerState): string | null {
  if (value.mode === "none") {
    return null;
  }

  if (value.mode === "create") {
    return "create";
  }

  return `edit:${value.postId}`;
}

function isSameNoteComposer(a: NoteComposerState, b: NoteComposerState): boolean {
  if (a.mode !== b.mode) {
    return false;
  }

  if (a.mode === "edit" && b.mode === "edit") {
    return a.postId === b.postId;
  }

  return true;
}

function parseQuery(query: string): ParsedQuery {
  const params = new URLSearchParams(query);

  const viewValues: string[] = [];
  const noteComposerValues: string[] = [];
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

    if (key === NOTE_COMPOSER_KEY) {
      noteComposerValues.push(value);
      continue;
    }

    unknownEntries.push([key, value]);
  }

  const view = normalizeView(viewValues[0]);
  const normalizedNoteComposer = normalizeNoteComposer(noteComposerValues[0]);
  const noteComposer = view === "note" ? normalizedNoteComposer : { mode: "none" as const };

  return {
    unknownEntries,
    state: {
      view,
      activeMode: toActiveMode(view),
      favoriteMemo: favoriteMemoCount > 0,
      favoriteNote: favoriteNoteCount > 0,
      noteComposer,
    },
    meta: {
      viewCount: viewValues.length,
      firstViewRaw: viewValues[0],
      favoriteMemoCount,
      favoriteNoteCount,
      noteComposerCount: noteComposerValues.length,
      firstNoteComposerRaw: noteComposerValues[0],
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

  if (state.view === "note") {
    const noteComposerParam = noteComposerToParam(state.noteComposer);
    if (noteComposerParam) {
      params.append(NOTE_COMPOSER_KEY, noteComposerParam);
    }
  }

  return params.toString();
}

export function normalizeAuthedQuery(query: string): QueryBuildResult {
  const parsed = parseQuery(query);
  const normalizedRawNoteComposer = normalizeNoteComposer(parsed.meta.firstNoteComposerRaw);
  const normalizedNoteComposerParam = noteComposerToParam(normalizedRawNoteComposer);
  const shouldNormalizeNoteComposer =
    parsed.meta.noteComposerCount > 1 ||
    (parsed.meta.firstNoteComposerRaw !== undefined &&
      normalizedNoteComposerParam !== parsed.meta.firstNoteComposerRaw) ||
    (parsed.state.view !== "note" && parsed.meta.noteComposerCount > 0);

  const shouldNormalize =
    parsed.meta.viewCount === 0 ||
    parsed.meta.viewCount > 1 ||
    parsed.meta.favoriteMemoCount > 1 ||
    parsed.meta.favoriteNoteCount > 1 ||
    normalizeView(parsed.meta.firstViewRaw) !== parsed.meta.firstViewRaw ||
    shouldNormalizeNoteComposer;

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
    noteComposer: nextView === "note" ? parsed.state.noteComposer : { mode: "none" },
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

export type NoteComposerOpenInput =
  | { mode: "create" }
  | { mode: "edit"; postId: string };

function toNoteComposerState(input: NoteComposerOpenInput): NoteComposerState {
  if (input.mode === "create") {
    return { mode: "create" };
  }

  return { mode: "edit", postId: input.postId };
}

export function buildQueryForNoteComposerOpen(
  query: string,
  input: NoteComposerOpenInput
): QueryBuildResult {
  const normalized = normalizeAuthedQuery(query);
  const parsed = parseQuery(normalized.nextQuery);

  if (parsed.state.view !== "note") {
    return {
      nextQuery: normalized.nextQuery,
      changed: false,
      state: parsed.state,
    };
  }

  const nextNoteComposer = toNoteComposerState(input);
  if (isSameNoteComposer(parsed.state.noteComposer, nextNoteComposer)) {
    return {
      nextQuery: normalized.nextQuery,
      changed: false,
      state: parsed.state,
    };
  }

  const nextState: AuthedQueryState = {
    ...parsed.state,
    noteComposer: nextNoteComposer,
  };
  const nextQuery = toQueryString(parsed.unknownEntries, nextState);

  return {
    nextQuery,
    changed: nextQuery !== normalized.nextQuery,
    state: nextState,
  };
}

export function buildQueryForNoteComposerClose(query: string): QueryBuildResult {
  const normalized = normalizeAuthedQuery(query);
  const parsed = parseQuery(normalized.nextQuery);

  if (parsed.state.noteComposer.mode === "none") {
    return {
      nextQuery: normalized.nextQuery,
      changed: false,
      state: parsed.state,
    };
  }

  const nextState: AuthedQueryState = {
    ...parsed.state,
    noteComposer: { mode: "none" },
  };
  const nextQuery = toQueryString(parsed.unknownEntries, nextState);

  return {
    nextQuery,
    changed: nextQuery !== normalized.nextQuery,
    state: nextState,
  };
}

export function toRootPath(query: string): string {
  return query.length > 0 ? `/?${query}` : "/";
}
