export type PostMode = "memo" | "note";

export type StubPost = {
  id: string;
  mode: PostMode;
  content: string;
  createdAt: string;
  favorite: boolean;
};

export type StubUser = {
  name: string;
  handle: string;
};

export const stubUser: StubUser = {
  name: "テストユーザー",
  handle: "@mono-log",
};

export const stubPosts: StubPost[] = [
  {
    id: "post-001",
    mode: "memo",
    content: "買い物メモ: 牛乳、パン、トマト",
    createdAt: "2026-02-08 09:12",
    favorite: false,
  },
  {
    id: "post-002",
    mode: "note",
    content:
      "## 今日の学び\n" +
      "- UIの骨格を先に作ると作業が進めやすい\n" +
      "- smとmdで要素の固定位置を分ける\n" +
      "- スタブ操作はトーストで通知する\n" +
      "- 余白と行間を丁寧に調整する\n" +
      "- 長文は折りたたみUIで読みやすくする\n" +
      "- 後から実装する機能はUIだけ先に作る",
    createdAt: "2026-02-07 21:05",
    favorite: true,
  },
  {
    id: "post-003",
    mode: "memo",
    content: "打ち合わせは金曜 14:00 から",
    createdAt: "2026-02-07 10:45",
    favorite: false,
  },
  {
    id: "post-004",
    mode: "note",
    content:
      "## モノログのUIメモ\n" +
      "コンテナ1は固定で、コンテナ2はスクロール。\n" +
      "検索と絞り込み、エディタが同じ面に並ぶ。\n" +
      "ノートは最大10行表示で折りたたみ。",
    createdAt: "2026-02-06 18:30",
    favorite: false,
  },
];
