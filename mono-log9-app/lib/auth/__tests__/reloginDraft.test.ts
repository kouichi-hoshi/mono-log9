import {
  clearReloginDraft,
  loadReloginDraft,
  saveReloginDraft,
  type ReloginDraftPayload,
} from "@/lib/auth/reloginDraft";

describe("reloginDraft", () => {
  const payload: ReloginDraftPayload = {
    query: "view=note&noteComposer=create",
    memoDraft: "メモの下書き",
    editingMemoPostId: "post-001",
    editingMemoValue: "メモ編集の下書き",
    noteDraft: {
      title: "ノートタイトル",
      contentJson: { type: "doc", content: [{ type: "paragraph" }] },
      plainText: "ノート本文",
    },
  };

  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it("saves and loads relogin draft payload", () => {
    saveReloginDraft(payload);

    expect(loadReloginDraft()).toEqual(payload);
  });

  it("returns null and clears storage when payload is invalid", () => {
    sessionStorage.setItem("mono-log:relogin-draft:v1", "{invalid json}");

    expect(loadReloginDraft()).toBeNull();
    expect(sessionStorage.getItem("mono-log:relogin-draft:v1")).toBeNull();
  });

  it("expires stale payload by ttl", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValueOnce(1_000);
    saveReloginDraft(payload);

    nowSpy.mockReturnValueOnce(1_000 + 30 * 60 * 1000 + 1);
    expect(loadReloginDraft()).toBeNull();
    expect(sessionStorage.getItem("mono-log:relogin-draft:v1")).toBeNull();
  });

  it("clears relogin draft", () => {
    saveReloginDraft(payload);
    clearReloginDraft();

    expect(loadReloginDraft()).toBeNull();
  });
});
