import { createDocFromPlainText, extractContentText } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";

const note001Content = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "今日の学び" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "UIの骨格を先に作ると作業が進めやすい" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "smとmdで要素の固定位置を分ける" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "スタブ操作はトーストで通知する" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "余白と行間を丁寧に調整する" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "長文は折りたたみUIで読みやすくする" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "後から実装する機能はUIだけ先に作る" }],
            },
          ],
        },
      ],
    },
  ],
};

const note002Content = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "モノログのUIメモ" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "コンテナ1は固定で、コンテナ2はスクロール。" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "検索と絞り込み、エディタが同じ面に並ぶ。" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "ノートは最大10行表示で折りたたみ。" }],
    },
  ],
};

const trash002Content = createDocFromPlainText("旧バージョンの設計メモ");

const initialActivePosts: PostRecord[] = [
  {
    id: "11111111-1111-4111-8111-111111111001",
    mode: "memo",
    content: createDocFromPlainText("買い物メモ: 牛乳、パン、トマト"),
    contentText: "買い物メモ: 牛乳、パン、トマト",
    createdAt: "2026-02-08 09:12",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111002",
    mode: "note",
    content: note001Content,
    contentText: extractContentText(note001Content, "note"),
    createdAt: "2026-02-07 21:05",
    favorite: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111003",
    mode: "memo",
    content: createDocFromPlainText("打ち合わせは金曜 14:00 から"),
    contentText: "打ち合わせは金曜 14:00 から",
    createdAt: "2026-02-07 10:45",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111004",
    mode: "note",
    title: "モノログのUIメモ",
    content: note002Content,
    contentText: extractContentText(note002Content, "note"),
    createdAt: "2026-02-06 18:30",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111005",
    mode: "memo",
    content: createDocFromPlainText("朝のメモ: 10分だけ読書する"),
    contentText: "朝のメモ: 10分だけ読書する",
    createdAt: "2026-02-06 08:10",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111006",
    mode: "memo",
    content: createDocFromPlainText("メモ: 明日の昼はカレーを作る"),
    contentText: "メモ: 明日の昼はカレーを作る",
    createdAt: "2026-02-05 20:22",
    favorite: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111007",
    mode: "memo",
    content: createDocFromPlainText("メモ: 15時に歯医者へ電話"),
    contentText: "メモ: 15時に歯医者へ電話",
    createdAt: "2026-02-05 14:03",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111008",
    mode: "memo",
    content: createDocFromPlainText("作業メモ: PRレビューを2件返す"),
    contentText: "作業メモ: PRレビューを2件返す",
    createdAt: "2026-02-04 22:11",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111009",
    mode: "memo",
    content: createDocFromPlainText("TODO: 電池と洗剤を補充する"),
    contentText: "TODO: 電池と洗剤を補充する",
    createdAt: "2026-02-04 09:40",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111010",
    mode: "memo",
    content: createDocFromPlainText("メモ: ランチ後に散歩20分"),
    contentText: "メモ: ランチ後に散歩20分",
    createdAt: "2026-02-03 13:15",
    favorite: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111011",
    mode: "memo",
    content: createDocFromPlainText("買い足し: コーヒーフィルター"),
    contentText: "買い足し: コーヒーフィルター",
    createdAt: "2026-02-03 08:55",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111012",
    mode: "memo",
    content: createDocFromPlainText("メモ: 週末にクローゼット整理"),
    contentText: "メモ: 週末にクローゼット整理",
    createdAt: "2026-02-02 19:27",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111013",
    mode: "memo",
    content: createDocFromPlainText("作業メモ: APIエラー文言を確認"),
    contentText: "作業メモ: APIエラー文言を確認",
    createdAt: "2026-02-02 11:06",
    favorite: false,
  },
  {
    id: "11111111-1111-4111-8111-111111111014",
    mode: "memo",
    content: createDocFromPlainText("メモ: 早寝する（23時まで）"),
    contentText: "メモ: 早寝する（23時まで）",
    createdAt: "2026-02-01 23:00",
    favorite: false,
  },
];

const initialTrashPosts: PostRecord[] = [
  {
    id: "22222222-2222-4222-8222-222222222001",
    mode: "memo",
    content: createDocFromPlainText("破棄候補メモ: 先週の打ち合わせメモ"),
    contentText: "破棄候補メモ: 先週の打ち合わせメモ",
    createdAt: "2026-01-30 16:20",
    trashedAt: "2026-02-08 12:41",
    favorite: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222002",
    mode: "note",
    title: "古い設計メモ",
    content: trash002Content,
    contentText: extractContentText(trash002Content, "note"),
    createdAt: "2026-01-28 09:10",
    trashedAt: "2026-02-08 10:05",
    favorite: false,
  },
  {
    id: "22222222-2222-4222-8222-222222222003",
    mode: "memo",
    content: createDocFromPlainText("削除予定: 一時メモ"),
    contentText: "削除予定: 一時メモ",
    createdAt: "2026-01-25 20:02",
    trashedAt: "2026-02-07 19:55",
    favorite: false,
  },
];

const initialStubPosts: PostRecord[] = [...initialActivePosts, ...initialTrashPosts];

export function cloneInitialStubPosts(): PostRecord[] {
  return initialStubPosts.map((post) => ({
    ...post,
    content: JSON.parse(JSON.stringify(post.content)),
  }));
}
