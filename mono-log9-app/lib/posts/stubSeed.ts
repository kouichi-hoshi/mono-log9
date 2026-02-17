import type { PostRecord } from "@/lib/posts/types";

const initialActivePosts: PostRecord[] = [
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
      "<h2>今日の学び</h2>" +
      "<ul>" +
      "<li>UIの骨格を先に作ると作業が進めやすい</li>" +
      "<li>smとmdで要素の固定位置を分ける</li>" +
      "<li>スタブ操作はトーストで通知する</li>" +
      "<li>余白と行間を丁寧に調整する</li>" +
      "<li>長文は折りたたみUIで読みやすくする</li>" +
      "<li>後から実装する機能はUIだけ先に作る</li>" +
      "</ul>",
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
    title: "モノログのUIメモ",
    content:
      "<h2>モノログのUIメモ</h2>" +
      "<p>コンテナ1は固定で、コンテナ2はスクロール。</p>" +
      "<p>検索と絞り込み、エディタが同じ面に並ぶ。</p>" +
      "<p>ノートは最大10行表示で折りたたみ。</p>",
    createdAt: "2026-02-06 18:30",
    favorite: false,
  },
  {
    id: "post-005",
    mode: "memo",
    content: "朝のメモ: 10分だけ読書する",
    createdAt: "2026-02-06 08:10",
    favorite: false,
  },
  {
    id: "post-006",
    mode: "memo",
    content: "メモ: 明日の昼はカレーを作る",
    createdAt: "2026-02-05 20:22",
    favorite: true,
  },
  {
    id: "post-007",
    mode: "memo",
    content: "メモ: 15時に歯医者へ電話",
    createdAt: "2026-02-05 14:03",
    favorite: false,
  },
  {
    id: "post-008",
    mode: "memo",
    content: "作業メモ: PRレビューを2件返す",
    createdAt: "2026-02-04 22:11",
    favorite: false,
  },
  {
    id: "post-009",
    mode: "memo",
    content: "TODO: 電池と洗剤を補充する",
    createdAt: "2026-02-04 09:40",
    favorite: false,
  },
  {
    id: "post-010",
    mode: "memo",
    content: "メモ: ランチ後に散歩20分",
    createdAt: "2026-02-03 13:15",
    favorite: true,
  },
  {
    id: "post-011",
    mode: "memo",
    content: "買い足し: コーヒーフィルター",
    createdAt: "2026-02-03 08:55",
    favorite: false,
  },
  {
    id: "post-012",
    mode: "memo",
    content: "メモ: 週末にクローゼット整理",
    createdAt: "2026-02-02 19:27",
    favorite: false,
  },
  {
    id: "post-013",
    mode: "memo",
    content: "作業メモ: APIエラー文言を確認",
    createdAt: "2026-02-02 11:06",
    favorite: false,
  },
  {
    id: "post-014",
    mode: "memo",
    content: "メモ: 早寝する（23時まで）",
    createdAt: "2026-02-01 23:00",
    favorite: false,
  },
];

const initialTrashPosts: PostRecord[] = [
  {
    id: "trash-001",
    mode: "memo",
    content: "破棄候補メモ: 先週の打ち合わせメモ",
    createdAt: "2026-01-30 16:20",
    trashedAt: "2026-02-08 12:41",
    favorite: false,
  },
  {
    id: "trash-002",
    mode: "note",
    title: "古い設計メモ",
    content: "旧バージョンの設計メモ",
    createdAt: "2026-01-28 09:10",
    trashedAt: "2026-02-08 10:05",
    favorite: false,
  },
  {
    id: "trash-003",
    mode: "memo",
    content: "削除予定: 一時メモ",
    createdAt: "2026-01-25 20:02",
    trashedAt: "2026-02-07 19:55",
    favorite: false,
  },
];

const initialStubPosts: PostRecord[] = [...initialActivePosts, ...initialTrashPosts];

export function cloneInitialStubPosts(): PostRecord[] {
  return initialStubPosts.map((post) => ({ ...post }));
}
