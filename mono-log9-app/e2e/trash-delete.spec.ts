import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function createTrashedMemo(page: Page, content: string) {
  await page.goto("/?stubAuth=1&view=memo");
  await page.getByLabel("メモ本文").fill(content);
  await page.getByRole("button", { name: "保存する" }).click();

  const memoCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: content }).first();
  await expect(memoCard).toBeVisible();
  await memoCard.getByRole("button", { name: "削除" }).first().click();

  await page.goto("/?stubAuth=1&view=trash");
  await expect(page.getByText(content)).toBeVisible();
}

test("trash delete: 選択した投稿を削除できる", async ({ page }) => {
  const content = `e2e-trash-bulk-${Date.now()}`;
  await createTrashedMemo(page, content);

  const targetTrashCard = page
    .locator('[data-testid^="trash-post-card-"]')
    .filter({ hasText: content })
    .first();
  await targetTrashCard.getByRole("checkbox").click();
  await page.getByRole("button", { name: "選択した投稿を削除" }).click();

  await expect(page.getByText("1件の投稿を完全に削除しますか?")).toBeVisible();
  await page.getByRole("button", { name: "削除する" }).click();

  await expect(page.getByText(content)).toHaveCount(0);
});

test("trash delete: ごみ箱を空にするで一覧が空になる", async ({ page }) => {
  const content = `e2e-trash-empty-${Date.now()}`;
  await createTrashedMemo(page, content);

  await page.getByRole("button", { name: "ごみ箱を空にする" }).click();
  await expect(page.getByText("ごみ箱内のすべての投稿を完全に削除しますか?")).toBeVisible();
  await page.getByRole("button", { name: "削除する" }).click();

  await expect(page.getByText(content)).toHaveCount(0);
  await expect(page.getByText("投稿がありません。")).toBeVisible();
});
