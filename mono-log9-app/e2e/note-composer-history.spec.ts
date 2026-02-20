import { expect, test } from "@playwright/test";

test("noteComposer: 開くと履歴を1件積み、戻る/進むでモーダル状態を復元する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await expect(page).toHaveURL(/view=note.*noteComposer=create/);
  await expect(page.getByLabel("ノートタイトル")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/view=note$/);
  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);

  await page.goForward();
  await expect(page).toHaveURL(/view=note.*noteComposer=create/);
  await expect(page.getByLabel("ノートタイトル")).toBeVisible();
});

test("noteComposer: dirty時の戻るで『編集を続ける』を選ぶとモーダル状態を維持する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("履歴保持");

  await page.goBack();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await page.getByRole("button", { name: "編集を続ける" }).click();

  await expect(page).toHaveURL(/view=note.*noteComposer=create/);
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("履歴保持");
});

test("noteComposer: dirty時の戻るで『破棄して続行』を選ぶとモーダルを閉じる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("履歴破棄");

  await page.goBack();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();
  await page.getByRole("button", { name: "破棄して続行" }).click();

  await expect(page).toHaveURL(/view=note$/);
  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
});
