# 項番9 実装プラン（再作成版）: TipTapカスタマイズ（DOMPurify組み込み込み）

## サマリー
- 対象は `docs/manage/作業計画書.md` の項番9。
- `docs/specs/08.仕様書 Tiptap.md` に従い、ノート編集で以下を実現する。  
  1. ツールバー: 見出し（H2/H3/H4）、リスト、太字、リンク  
  2. md記法入力: `# / ##`、`- / 1.`、`**text**`  
  3. md風表示: エディタ + PostCard
- PostCardのHTML描画は `DOMPurify` でサニタイズしてから表示する。
- 非対象: `[text](url)` 入力変換、Markdown文字列の保存/入出力。

## ゴール（完了条件）
1. `NoteEditor` でツールバー操作により H2/H3/H4、箇条書き/番号付き、太字、リンク設定/解除ができる。
2. `# / ##`、`- / 1.`、`**text**` の入力が書式化される。
3. `PostCard` のノート本文が md風スタイルで表示される。
4. `dangerouslySetInnerHTML` に渡すHTMLが `DOMPurify` 経由になっている。
5. lint/test が通る。

## スコープ
- In
1. `dompurify` 依存追加
2. ツールバーUI追加
3. リンク設定UI（URL入力ダイアログ）
4. PostCard HTMLレンダリング + サニタイズ
5. md風CSS追加
6. ユニット/統合テスト追加
- Out
1. `[text](url)` 自動変換
2. Markdown文字列の双方向変換
3. DB/API仕様変更

## 変更対象（インターフェース/型）
1. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/package.json`
- `dependencies` に `dompurify` 追加

2. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/components/authed/NoteEditor.tsx`
- `StarterKit.configure({ heading: { levels: [2,3,4] }, link: { openOnClick: false } })` に更新
- `NoteToolbar` / `LinkDialog` を組み込む
- エディタ領域に `.tiptap` クラスを明示

3. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/components/authed/NoteToolbar.tsx`（新規）
- Props: `editor: Editor | null`, `onLinkClick: () => void`, `onUnlinkClick: () => void`
- ボタン: `H2`, `H3`, `H4`, `箇条書き`, `番号付き`, `太字`, `リンク`, `リンク解除`

4. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/components/authed/LinkDialog.tsx`（新規）
- Props: `open`, `onOpenChange`, `onSubmit(url: string)`
- バリデーション: 空文字不可、`http(s)://` 未指定時は `https://` 補完

5. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/lib/sanitizeRichHtml.ts`（新規）
- `sanitizeRichHtml(html: string): string`
- `DOMPurify.sanitize` の許可設定:
  - tags: `h2,h3,h4,p,ul,ol,li,strong,a,br`
  - attrs: `href,target,rel`
- 危険URL（`javascript:` 等）は除去

6. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/components/authed/PostCard.tsx`
- ノート本文表示を `sanitizeRichHtml(post.content)` 経由のHTML描画に変更
- `noteHasTitle` 優先ロジックは維持

7. `/Users/kouichi/project/my_project/mono-log/mono-log9/mono-log9-app/app/globals.css`
- `.tiptap ...` と `.md-content ...` のmd風ルールを追加  
  - `h2/h3/h4` 見出しサイズ・余白  
  - `ul/ol` インデント  
  - `strong` 太字  
  - `a` 下線・色・hover

## 実装ステップ（TDD / サブエージェント運用）
1. director
- 仕様固定: `docs/specs/08.仕様書 Tiptap.md` と項番9の要件をチェックリスト化

2. tester（Red）
- 先に失敗テストを作成
  - ツールバー操作
  - md入力での書式化
  - サニタイズ
  - PostCard表示

3. ui-builder
- `NoteToolbar` / `LinkDialog` 実装
- `NoteEditor` に統合
- CSSでmd風表示実装

4. programmer（Green）
- `sanitizeRichHtml` 実装
- `PostCard` をサニタイズ済みHTML描画へ変更
- テストGreen化

5. tester
- 回帰確認（既存項番8テスト含む）
- テスト観点不足の再指摘

6. director
- 項番9の完了判定（仕様一致・lint/test通過・非対象範囲逸脱なし）

## テストケース（追加）
1. `TC-9-001` H2/H3/H4 ボタンで見出し切替できる
2. `TC-9-002` 箇条書き/番号付きボタンでリスト切替できる
3. `TC-9-003` 太字ボタンで `strong` が付与/解除される
4. `TC-9-004` リンクダイアログでURL適用、リンク解除で除去される
5. `TC-9-005` `## ` / `- ` / `1. ` / `**text**` で書式化される
6. `TC-9-006` PostCardで `h2/ul/strong/a` がmd風表示される
7. `TC-9-007` `script` や危険 `href` がサニタイズされる
8. `TC-9-008` 既存の保存/更新スタブ挙動が壊れない

## 失敗モード・対策
1. リンク設定時に選択範囲がない
- 対策: カーソル位置のlink mark更新ではなく、UIで「テキスト選択後に設定」ガード表示

2. サニタイズで必要タグまで落ちる
- 対策: 許可タグ/属性をテストで固定、変更時はテスト更新必須

3. エディタ内リンク誤クリックで遷移
- 対策: `openOnClick: false` を明示

## 前提・デフォルト
1. 依存追加は `dompurify` のみ
2. `[text](url)` 入力変換は実装しない
3. Markdown文字列保存/入出力は実装しない
4. 項番9はUI/表示レイヤー中心で、保存仕様（項番17）には踏み込まない
