export type Tag = {
  id: string;
  label: string;
};

export type Post = {
  id: string;
  date: string;
  mode: "メモ" | "ノート";
  body: string;
  tags: Tag[];
  isFavorite?: boolean;
};

export const stubUser = {
  name: "こういち",
  handle: "kouichi",
  avatarFallback: "K",
};

export const stubTags: Tag[] = [
  { id: "tag-work", label: "仕事" },
  { id: "tag-diary", label: "日記" },
  { id: "tag-idea", label: "アイデア" },
  { id: "tag-travel", label: "旅行" },
  { id: "tag-book", label: "読書" },
  { id: "tag-health", label: "健康" },
  { id: "tag-learning", label: "学習" },
  { id: "tag-shopping", label: "買い物" },
  { id: "tag-reflection", label: "振り返り" },
  { id: "tag-workout", label: "運動" },
];

export const stubPosts: Post[] = [
  {
    id: "post-1",
    date: "2026-02-08",
    mode: "メモ",
    body:
      "朝のタスク整理。今週はUIを先に固めて、機能実装はフェーズ2でまとめる。",
    tags: [stubTags[0], stubTags[2], stubTags[5]],
    isFavorite: true,
  },
  {
    id: "post-2",
    date: "2026-02-07",
    mode: "ノート",
    body:
      "読書メモ：短いログを積み重ねて振り返りを支える仕組みが重要。",
    tags: [stubTags[4], stubTags[8]],
  },
  {
    id: "post-3",
    date: "2026-02-06",
    mode: "メモ",
    body:
      "散歩中のアイデア。タグと検索の体験は軽く、入力ストレスを減らしたい。",
    tags: [stubTags[2], stubTags[9]],
  },
  {
    id: "post-4",
    date: "2026-02-05",
    mode: "ノート",
    body:
      "旅行メモ：記録と写真をひも付ける導線は将来の拡張ポイント。",
    tags: [stubTags[3], stubTags[1]],
  },
  {
    id: "post-5",
    date: "2026-02-03",
    mode: "メモ",
    body:
      "買い物リスト：ストック、ケーブル、コーヒー豆。お気に入りで固定する？",
    tags: [stubTags[7]],
  },
];
