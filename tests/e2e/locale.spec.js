import { test, expect } from "@playwright/test";

test("German is the first-run language and English preference persists", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("#nav")).toContainText("Wetter");
  await page.locator('#nav [data-view="locations"]').click();
  await expect(page.locator("#searchForm button")).toHaveText("Suchen");
  await expect(page.locator("main")).not.toContainText(/findenen/i);
  await page.locator('#nav [data-view="history"]').click();
  await expect(page.locator("main")).toContainText("Wetterrückblick");
  await expect(page.locator("main")).not.toContainText(/A small historical sample|Explore hourly weather/i);
  await page.locator('#nav [data-view="models"]').click();
  await expect(page.locator("main")).toContainText("Hinter der Prognose");
  await expect(page.locator("main")).toContainText("So entsteht die Konsensprognose");
  await expect(page.locator("main")).not.toContainText(/Regional detail|ICON gets the most influence/i);
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("de");
  await expect(page.locator("main")).toContainText("RainViewer");
  await expect(page.locator("main")).toContainText("Mit Scriptable kannst du Wettra");
  await expect(page.locator("main")).not.toContainText(/Use Scriptable to show Wettra|Refresh target/i);
  await page.locator("#language").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#nav")).toContainText("Weather");
  await page.reload();
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("en");
  await expect(page.locator("#nav")).toContainText("Weather");
});
