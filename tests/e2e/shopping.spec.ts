import { test, expect } from "@playwright/test";

test("ログインしてアイテムを追加できる", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[placeholder="メールアドレス"]', process.env.TEST_EMAIL!);
  await page.fill('[placeholder="パスワード"]', process.env.TEST_PASSWORD!);
  await page.click('button:has-text("ログイン")');
  await expect(page).toHaveURL("/");

  await page.fill('[placeholder="品名を入力..."]', "テスト牛乳");
  await page.click('button:has-text("追加")');
  await expect(page.locator("text=テスト牛乳")).toBeVisible();
});

test("アイテムをタップしてアクティブ/非アクティブを切り替えられる", async ({
  page,
}) => {
  await page.goto("/");
  const item = page.locator("text=テスト牛乳").first();
  await item.click();
  await expect(item).toHaveCSS("text-decoration-line", "line-through");
});
