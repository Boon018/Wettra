import { test, expect } from "@playwright/test";
import { providers } from "./fixtures.js";

test("German is the first-run language and English preference persists", async ({
  page,
}) => {
  const favorite = JSON.stringify([
    { name: "Wien", latitude: 48.2082, longitude: 16.3738, country: "Austria" },
  ]);
  await page.addInitScript(
    (value) => localStorage.setItem("alpen.v1.favorites", value),
    favorite,
  );
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("#nav")).toContainText("Wetter");
  await expect(page.locator("#nav")).toHaveAttribute(
    "aria-label",
    "Hauptnavigation",
  );
  await page.locator('#nav [data-view="locations"]').click();
  await expect(page.locator("#searchForm button")).toHaveText("Suchen");
  await expect(page.locator("main")).not.toContainText(/findenen/i);
  await page.locator('#nav [data-view="history"]').click();
  await expect(page.locator("main")).toContainText("Wetterrückblick");
  await expect(page.locator("main")).not.toContainText(
    /A small historical sample|Explore hourly weather/i,
  );
  await page.locator('#nav [data-view="models"]').click();
  await expect(page.locator("main")).toContainText("Hinter der Prognose");
  await expect(page.locator("main")).toContainText(
    "So entsteht die Konsensprognose",
  );
  await expect(page.locator("main")).not.toContainText(
    /Regional detail|ICON gets the most influence/i,
  );
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("de");
  await expect(page.locator("main")).toContainText("RainViewer");
  await expect(page.locator("main")).toContainText(
    "Mit Scriptable kannst du Wettra",
  );
  await expect(page.locator("main")).toContainText(
    "Graz als Startort festlegen",
  );
  await expect(page.locator("main")).not.toContainText(
    /Use Scriptable to show Wettra|Refresh target/i,
  );
  await page.locator("#language").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#nav")).toContainText("Weather");
  await expect(page.locator("#nav")).toHaveAttribute(
    "aria-label",
    "Main navigation",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("alpen.v1.favorites")),
  ).toBe(favorite);
  await page.reload();
  await page.locator('#nav [data-view="settings"]').click();
  await expect(page.locator("#language")).toHaveValue("en");
  await expect(page.locator("#nav")).toContainText("Weather");
});

test("GPS errors and location help use the selected language", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "alpen.v1.settings",
      JSON.stringify({ language: "de" }),
    );
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition(ok, fail) {
          fail({ code: 1 });
        },
      },
    });
  });
  await page.goto("./");
  await expect
    .poll(() => page.locator("#status").textContent())
    .toMatch(/Aktualisiert|Wetterdienste|Offline/);
  await page.locator('#nav [data-view="locations"]').click();
  await page.locator('[data-action="gps"]').click();
  await expect(page.locator("#locationMessage")).toContainText(
    "Standortzugriff wurde verweigert",
  );
  await expect(page.locator("#locationHelpReason")).toHaveText(
    "Der Standortzugriff wurde verweigert.",
  );
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("radar failures use the selected language", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "alpen.v1.settings",
      JSON.stringify({ language: "de" }),
    );
  });
  await page.route("https://api.rainviewer.com/**", (route) => route.abort());
  await page.goto("./");
  await page.locator('[data-action="radar"]').first().click();
  await expect(page.locator("main")).toContainText(
    "Radar konnte nicht geladen werden",
  );
  await expect(page.locator("main")).not.toContainText(
    "The map is still usable",
  );
});

test("legacy table templates are localized during migration", async ({
  page,
}) => {
  await providers(page);
  await page.addInitScript(() => {
    localStorage.setItem(
      "alpen.v1.settings",
      JSON.stringify({ language: "de" }),
    );
  });
  await page.goto("./");
  await page.locator('#nav [data-view="models"]').click();
  await expect(page.locator("table")).toContainText("Stunde");
  await expect(page.locator("table")).not.toContainText("Hour");
  await page.locator('#nav [data-view="hourly"]').click();
  await expect(page.locator("table")).toContainText("Gefühlt");
  await expect(page.locator("table")).not.toContainText("Feels");
});
