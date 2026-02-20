import { expect, test } from "@playwright/test";

test("ノート本文にH2を適用して保存できる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("E2E H2 Save");

  const editor = page.getByLabel("ノート本文");
  await editor.click();
  await editor.fill("見出し付き本文");
  await page.keyboard.press("Meta+A");
  await page.getByRole("button", { name: "H2" }).click();

  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("入力内容に不備があります")).toHaveCount(0);
  await expect(page.getByText("E2E H2 Save")).toBeVisible();
});

test("ノート本文に引用を適用して保存できる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");

  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("E2E Quote Save");

  const editor = page.getByLabel("ノート本文");
  await editor.click();
  await editor.fill("引用本文");
  await page.keyboard.press("Meta+A");
  await page.getByRole("button", { name: "引用" }).click();

  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("入力内容に不備があります")).toHaveCount(0);
  await expect(page.getByText("E2E Quote Save")).toBeVisible();
});

test("メモは保存できる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  const input = page.getByLabel("メモ本文");
  await input.fill("E2E メモ保存");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("E2E メモ保存")).toBeVisible();
});

test("ノート平文は保存できる", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");
  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill("E2E Note Plain");
  const editor = page.getByLabel("ノート本文");
  await editor.click();
  await editor.fill("平文ノート本文");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("E2E Note Plain")).toBeVisible();
});

test("ノート新規保存後に破棄確認ダイアログを表示しない", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");
  await page.getByRole("button", { name: "ノートを書く" }).click();

  const title = `E2E Save No Discard ${Date.now()}`;
  await page.getByLabel("ノートタイトル").fill(title);
  const editor = page.getByLabel("ノート本文");
  await editor.click();
  await editor.fill("保存後に破棄確認が出ないことを確認");

  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page.getByText("編集中の内容があります。破棄して続行しますか？")).toHaveCount(0);
  await expect(page.getByLabel("ノートタイトル")).toHaveCount(0);
  await expect(page.getByText(title)).toBeVisible();
});
