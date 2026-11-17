import { test, expect } from "@playwright/test";

test("German is the first-run language and English preference persists", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("#nav")).toContainText("Wetter");
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("de");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#nav")).toContainText("Weather");
  await page.reload();
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("en");
  await expect(page.locator("#nav")).toContainText("Weather");
});
