import { expect, test, type Page } from "@playwright/test";

async function logoutFromUserMenu(page: Page) {
  await page.getByRole("button", { name: "ユーザーメニュー" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
}

test("logout history: ログアウト後の戻る/進むで履歴状態を検証する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");
  await expect(page.getByLabel("メモ本文")).toBeVisible();

  await logoutFromUserMenu(page);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/stubAuth=1/);
  await expect(page.getByLabel("メモ本文")).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
});

test("logout history: 戻る時の navigation type（BFCache観測値）を取得できる", async ({
  page,
}) => {
  await page.goto("/?stubAuth=1&view=note");
  await expect(page.getByRole("button", { name: "ノートを書く" })).toBeVisible();

  await logoutFromUserMenu(page);
  await expect(page).toHaveURL("/");

  await page.goBack();
  const navigationType = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return navigation?.type ?? null;
  });

  expect(navigationType).not.toBeNull();
  expect(["navigate", "reload", "back_forward"]).toContain(navigationType);
});
