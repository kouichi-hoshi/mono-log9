import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("major flow (stub): login -> create/edit -> favorite -> trash -> restore -> permanent delete", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const memoBody = `E2E major memo ${Date.now()}`;
  const noteTitle = `E2E major note ${Date.now()}`;
  const editedNoteTitle = `${noteTitle} edited`;

  await page.goto("/?view=memo");

  await page.getByRole("button", { name: "Googleでログイン" }).click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/stubAuth=1/);

  await page.getByLabel("メモ本文").fill(memoBody);
  await page.getByRole("button", { name: "保存する" }).click();
  const memoCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: memoBody }).first();
  await expect(memoCard).toBeVisible();

  await memoCard.getByRole("button", { name: "お気に入り" }).first().click();
  const favoriteFilterButton = page.getByTestId("favorite-filter-toggle");
  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(page.getByText(memoBody)).toBeVisible();
  await favoriteFilterButton.click();
  await expect(page).not.toHaveURL(/favoriteMemo/);

  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);
  await page.getByRole("button", { name: "ノートを書く" }).click();
  await page.getByLabel("ノートタイトル").fill(noteTitle);
  const noteEditor = page.getByLabel("ノート本文");
  await noteEditor.click();
  await noteEditor.fill("major flow note body");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText(noteTitle)).toBeVisible();

  const noteCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: noteTitle }).first();
  await noteCard.getByRole("button", { name: "編集" }).first().click();
  await page.getByLabel("ノートタイトル").fill(editedNoteTitle);
  const editNoteEditor = page.getByLabel("ノート本文");
  await editNoteEditor.click();
  await editNoteEditor.fill("major flow note body edited");
  await page.getByRole("button", { name: "更新する" }).click();
  await expect(page.getByText(editedNoteTitle)).toBeVisible();

  await page.getByRole("button", { name: "メモ" }).click();
  await expect(page).toHaveURL(/view=memo/);
  const memoCardAfterCreate = page.locator('[data-testid^="post-card-"]').filter({ hasText: memoBody }).first();
  await memoCardAfterCreate.getByRole("button", { name: "削除" }).first().click();

  await page.getByRole("button", { name: "ごみ箱" }).click();
  await expect(page).toHaveURL(/view=trash/);
  const trashedMemoCard = page
    .locator('[data-testid^="trash-post-card-"]')
    .filter({ hasText: memoBody })
    .first();
  await expect(trashedMemoCard).toBeVisible();

  await trashedMemoCard.getByRole("button", { name: "復元" }).click();
  await expect(page.getByText(memoBody)).toHaveCount(0);

  await page.getByRole("button", { name: "メモ" }).click();
  await expect(page.getByText(memoBody)).toBeVisible();
  const memoCardAfterRestore = page.locator('[data-testid^="post-card-"]').filter({ hasText: memoBody }).first();
  await memoCardAfterRestore.getByRole("button", { name: "削除" }).first().click();

  await page.getByRole("button", { name: "ごみ箱" }).click();
  const trashedMemoCardFinal = page
    .locator('[data-testid^="trash-post-card-"]')
    .filter({ hasText: memoBody })
    .first();
  await expect(trashedMemoCardFinal).toBeVisible();
  await trashedMemoCardFinal.getByRole("checkbox").click();
  await page.getByRole("button", { name: "選択した投稿を削除" }).click();
  await expect(page.getByText("1件の投稿を完全に削除しますか?")).toBeVisible();
  await page.getByRole("button", { name: "削除する" }).click();
  await expect(page.getByText(memoBody)).toHaveCount(0);
});
