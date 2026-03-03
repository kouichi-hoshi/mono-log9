import { expect, test } from "@playwright/test";

test("retry: 初回一覧取得失敗後に『再試行』で一覧を再表示できる", async ({ page }) => {
  await page.context().setExtraHTTPHeaders({
    "x-e2e-scenario": "list-initial-fail-once",
  });

  await page.goto("/?stubAuth=1&view=memo");

  await expect(page.getByRole("button", { name: "再試行" })).toBeVisible();
  await page.getByRole("button", { name: "再試行" }).click();

  await expect(page.getByText("買い物メモ: 牛乳、パン、トマト")).toBeVisible();
  await expect(page.getByRole("button", { name: "再試行" })).toHaveCount(0);
});
