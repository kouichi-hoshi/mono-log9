import { expect, test } from "@playwright/test";

test("hasEdits: URL変更時に『編集を続ける』を選ぶと遷移せず入力を維持する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  const memoInput = page.getByLabel("メモ本文");
  await memoInput.fill("編集中メモ");
  await page.getByRole("button", { name: "ごみ箱" }).click();

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await page.getByRole("button", { name: "編集を続ける" }).click();

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
  await expect(page).toHaveURL(/view=memo/);
  await expect(memoInput).toHaveValue("編集中メモ");
});

test("hasEdits: URL変更時に『破棄して続行』を選ぶと遷移する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await page.getByLabel("メモ本文").fill("破棄されるメモ");
  await page.getByRole("button", { name: "ごみ箱" }).click();
  await page.getByRole("button", { name: "破棄して続行" }).click();

  await expect(page).toHaveURL(/view=trash/);
  await expect(page.getByLabel("メモ本文")).toHaveCount(0);
});

test("hasEdits: お気に入り絞り込み変更時も離脱確認する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await page.getByLabel("メモ本文").fill("favorite切替前");
  await page.getByTestId("favorite-filter-toggle").click();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();

  await page.getByRole("button", { name: "編集を続ける" }).click();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
  await expect(page).toHaveURL(/view=memo/);
  await expect(page.getByLabel("メモ本文")).toHaveValue("favorite切替前");
});

test("hasEdits: 戻る操作で『編集を続ける』を選ぶと編集中状態を維持する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("戻る確認テスト");

  await page.goBack();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await page.getByRole("button", { name: "編集を続ける" }).click();

  await expect(page).toHaveURL(/view=note.*noteComposer=create/);
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("戻る確認テスト");
});

test("hasEdits: 戻る操作で『破棄して続行』を選ぶと遷移する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("戻る破棄テスト");

  await page.goBack();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await page.getByRole("button", { name: "破棄して続行" }).click();

  await expect(page).toHaveURL(/view=note/);
});

test("hasEdits: 進む操作でも離脱確認し、破棄で遷移する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.goBack();
  await expect(page).toHaveURL(/view=memo/);

  await page.getByLabel("メモ本文").fill("進む確認");
  await page.goForward();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();

  await page.getByRole("button", { name: "破棄して続行" }).click();
  await expect(page).toHaveURL(/view=note/);
});

test("hasEdits: ノート空欄でキャンセルすると即時に閉じる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await expect(page.getByLabel("ノートタイトル")).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
});

test("hasEdits: ノート編集中のEscで離脱確認を表示する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("Escテスト");
  await page.keyboard.press("Escape");

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
});

test("hasEdits: ノート空欄のEscは確認なしで閉じる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await expect(page.getByLabel("ノートタイトル")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
});

test("hasEdits: ノート背景クリックでdirty時は離脱確認を表示する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("背景クリックテスト");
  await page.mouse.click(10, 10);

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
});

test("hasEdits: ノート背景クリックでclean時は確認なしで閉じる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await expect(page.getByLabel("ノートタイトル")).toBeVisible();
  await page.mouse.click(10, 10);

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
});

test("hasEdits: 離脱確認ダイアログ文言が仕様通りである", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("文言確認");
  await page.getByRole("button", { name: "キャンセル" }).click();

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await expect(page.getByRole("button", { name: "破棄して続行" })).toBeVisible();
  await expect(page.getByRole("button", { name: "編集を続ける" })).toBeVisible();
});
