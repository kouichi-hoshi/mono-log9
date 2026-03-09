import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("real smoke: authjs未ログイン画面が表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Googleでログイン" })).toBeVisible();
  await expect(page).not.toHaveURL(/stubAuth=/);
});
