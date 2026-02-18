import { expect, test } from "@playwright/test";

test("メモ空入力の保存でバリデーションを表示する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("内容を入力してください")).toBeVisible();
});

test("ノート空入力の保存でバリデーションを表示する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("内容を入力してください")).toBeVisible();
});

test("ノート離脱確認で編集継続と破棄終了を選べる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("下書きタイトル");

  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByText("入力中の内容を破棄しますか？")).toBeVisible();

  await page.getByRole("button", { name: "編集を続ける" }).click();
  await expect(page.getByText("入力中の内容を破棄しますか？")).toHaveCount(0);
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("下書きタイトル");

  await page.getByRole("button", { name: "キャンセル" }).click();
  await page.getByRole("button", { name: "破棄して閉じる" }).click();

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ノートを書く" })).toBeVisible();
});

test("メモ文字数超過の保存では入力を維持して失敗する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  const longMemo = "a".repeat(281);

  const input = page.getByLabel("メモ本文");
  await input.fill(longMemo);
  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("内容は最大280文字までです")).toBeVisible();
  await expect(input).toHaveValue(longMemo);
});
