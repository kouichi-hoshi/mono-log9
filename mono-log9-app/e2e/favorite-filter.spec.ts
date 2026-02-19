import { expect, test } from "@playwright/test";

const favoriteFilterButtonSelector = 'button[aria-pressed]:has-text("お気に入り")';

test("memo: favorite ON/OFFでURLと表示が追従する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toBeVisible();
  const favoriteFilterButton = page.locator(favoriteFilterButtonSelector);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toHaveCount(0);
  await expect(page.getByText("メモ: 明日の昼はカレーを作る")).toBeVisible();

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).not.toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toBeVisible();
});

test("memo/noteでfavorite状態を分離し、戻る/進むで復元する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  const favoriteFilterButton = page.locator(favoriteFilterButtonSelector);

  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");
  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);
  await expect(page).not.toHaveURL(/favoriteNote/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/view=note/);
  await expect(page).toHaveURL(/favoriteNote/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");

  await page.goBack();
  await expect(page).toHaveURL(/view=note/);
  await expect(page).not.toHaveURL(/favoriteNote/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await page.goBack();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");

  await page.goForward();
  await expect(page).toHaveURL(/view=note/);
  await expect(page).not.toHaveURL(/favoriteNote/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await page.goForward();
  await expect(page).toHaveURL(/view=note/);
  await expect(page).toHaveURL(/favoriteNote/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");
});

test("trashではfavoriteを評価せず、memo復帰時に再評価する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  const favoriteFilterButton = page.locator(favoriteFilterButtonSelector);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "ごみ箱" }).click();
  await expect(page).toHaveURL(/view=trash/);
  await expect(page.locator(favoriteFilterButtonSelector)).toHaveCount(0);

  await page.getByRole("button", { name: "メモ" }).click();
  await expect(page).toHaveURL(/view=memo/);
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toHaveCount(0);
});

test("通常一覧でON化した投稿がfavorite一覧に即時反映される", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  const favoriteFilterButton = page.locator(favoriteFilterButtonSelector);

  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toBeVisible();
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");
  await favoriteFilterButton.click();
  await expect(page).not.toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "false");

  const targetContent = page
    .getByTestId("post-content")
    .filter({ hasText: "買い物メモ: 牛乳、パン、トマト" })
    .first();
  const targetCard = targetContent.locator("xpath=ancestor::article[1]");
  await targetCard.locator("button:has-text('お気に入り')").first().click();

  await favoriteFilterButton.click();
  await expect(page).toHaveURL(/favoriteMemo/);
  await expect(favoriteFilterButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toBeVisible();
});
