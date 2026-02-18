import { expect, test } from "@playwright/test";

test("メモ一覧で無限スクロールにより追加取得される", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  const cards = page.getByTestId("post-content");
  await expect(cards.first()).toBeVisible();
  const initialCount = await cards.count();

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await expect
    .poll(async () => cards.count(), {
      message: "追加取得後にカード数が増えること",
    })
    .toBeGreaterThan(initialCount);
});

test("終端到達後は追加取得sentinelが消える", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  for (let i = 0; i < 5; i += 1) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(300);
  }

  await expect(page.getByTestId("posts-load-more-sentinel")).toHaveCount(0);
});

test("メモからノートへ移動後に戻るとメモのスクロール位置を復元する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await expect(page.getByTestId("post-content").first()).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  const memoScrollY = await page.evaluate(() => window.scrollY);
  expect(memoScrollY).toBeGreaterThan(0);

  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.goBack();
  await expect(page).toHaveURL(/view=memo/);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), {
      message: "戻る操作後にメモ一覧のスクロールが最上部以外へ復元されること",
    })
    .toBeGreaterThan(0);
});

test("モード切替と戻るを繰り返してもメモのスクロール位置を復元する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=memo");

  await expect(page.getByTestId("post-content").first()).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  const memoScrollY = await page.evaluate(() => window.scrollY);
  expect(memoScrollY).toBeGreaterThan(0);

  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.getByRole("button", { name: "メモ" }).click();
  await expect(page).toHaveURL(/view=memo/);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  const memoScrollY2 = await page.evaluate(() => window.scrollY);
  expect(memoScrollY2).toBeGreaterThan(0);

  await page.getByRole("button", { name: "ノート" }).click();
  await expect(page).toHaveURL(/view=note/);

  await page.goBack();
  await expect(page).toHaveURL(/view=memo/);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), {
      message: "1回目の戻る後にメモのスクロール位置が復元されること",
    })
    .toBeGreaterThan(0);

  await page.goBack();
  await expect(page).toHaveURL(/view=note/);

  await page.goBack();
  await expect(page).toHaveURL(/view=memo/);
  await expect
    .poll(async () => page.evaluate(() => window.scrollY), {
      message: "3回目の戻る後もメモのスクロール位置が最上部にならないこと",
    })
    .toBeGreaterThan(0);
});
