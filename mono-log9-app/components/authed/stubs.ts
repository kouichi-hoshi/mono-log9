export type StubUser = {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarFallback: string;
};

export type StubTag = {
  id: string;
  name: string;
  count: number;
};

export type StubPost = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
  starred: boolean;
  mode: "memo" | "note";
};

export const stubUser: StubUser = {
  id: "user-001",
  name: "小路 洸一",
  handle: "@kouichi",
  role: "スタブユーザー",
  avatarFallback: "K",
};

export const stubTags: StubTag[] = [
  { id: "tag-001", name: "設計", count: 12 },
  { id: "tag-002", name: "日報", count: 8 },
  { id: "tag-003", name: "実験", count: 5 },
  { id: "tag-004", name: "リサーチ", count: 7 },
  { id: "tag-005", name: "レビュー", count: 4 },
  { id: "tag-006", name: "アイデア", count: 9 },
];

export const stubPosts: StubPost[] = [
  {
    id: "post-001",
    title: "新しいUI構造のメモ",
    body: "モバイルでは下部固定のコンテナ1に編集と検索を集約。カードは縦スクロールに統一。",
    tags: ["設計", "メモ"],
    updatedAt: "2時間前",
    starred: true,
    mode: "memo",
  },
  {
    id: "post-002",
    title: "仕様書レビューの気づき",
    body: "タグ管理の導線を分離することで、検索と編集のUXが整理される。",
    tags: ["レビュー", "リサーチ"],
    updatedAt: "昨日",
    starred: false,
    mode: "note",
  },
  {
    id: "post-003",
    title: "スプリントの振り返り",
    body: "テスト設計の粒度を上げると開発速度が安定する。UIはスタブで先行。",
    tags: ["日報", "アイデア"],
    updatedAt: "2日前",
    starred: false,
    mode: "note",
  },
  {
    id: "post-004",
    title: "メモ：タグ運用方針",
    body: "タグは最大10件まで。クラウドは使用頻度順に並べる。",
    tags: ["メモ", "設計"],
    updatedAt: "3日前",
    starred: true,
    mode: "memo",
  },
];
