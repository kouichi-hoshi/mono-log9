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
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toBeVisible();

  await page.getByRole("button", { name: "編集を続ける" }).click();
  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("下書きタイトル");

  await page.getByRole("button", { name: "キャンセル" }).click();
  await page.getByRole("button", { name: "破棄して続行" }).click();

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "ノートを書く" })).toBeVisible();
});

test("ノート編集モーダルで既存投稿のタイトル・本文が表示される", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await expect(page.getByText("今日の学び")).toBeVisible();
  const noteCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: "今日の学び" }).first();
  await noteCard.getByRole("button", { name: "編集" }).first().click();

  const titleInput = page.getByLabel("ノートタイトル");
  await expect(titleInput).toBeVisible();
  await expect(page.getByLabel("ノート本文")).toContainText(/今日の学び|UIの骨格/);
});

test("ノート編集を閉じて再度開いても同じ内容が表示される", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  const noteCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: "モノログのUIメモ" }).first();
  await noteCard.getByRole("button", { name: "編集" }).first().click();

  await expect(page.getByLabel("ノートタイトル")).toHaveValue("モノログのUIメモ");
  await expect(page.getByLabel("ノート本文")).toContainText(/コンテナ1は固定/);

  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);

  await noteCard.getByRole("button", { name: "編集" }).first().click();
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("モノログのUIメモ");
  await expect(page.getByLabel("ノート本文")).toContainText(/コンテナ1は固定/);
});

test("ノート編集を保存した後に再度編集しても破棄確認は表示されない", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  const noteCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: "今日の学び" }).first();
  await noteCard.getByRole("button", { name: "編集" }).first().click();

  await page.getByLabel("ノートタイトル").fill("保存後に再編集");
  await page.getByRole("button", { name: "更新する" }).click();

  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);

  const savedCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: "保存後に再編集" }).first();
  await savedCard.getByRole("button", { name: "編集" }).first().click();

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
  await expect(page.getByLabel("ノートタイトル")).toHaveValue("保存後に再編集");
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
