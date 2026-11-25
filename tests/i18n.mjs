import assert from "node:assert/strict";
import de from "../src/ui/messages.de.js";
import en from "../src/ui/messages.en.js";
import { settings } from "../src/app/state.js";
import { fmt, time } from "../src/ui/format.js";
import { currentLanguage, t } from "../src/ui/i18n.js";

assert.deepEqual(
  Object.keys(de).sort(),
  Object.keys(en).sort(),
  "locale catalogs share the same keys",
);
for (const [key, message] of Object.entries(de)) {
  assert.ok(message.length > 0, `German message ${key} is not empty`);
  assert.ok(en[key]?.length > 0, `English message ${key} is not empty`);
}

settings.language = "de";
assert.equal(currentLanguage(), "de");
assert.equal(t("nav.weather"), "Wetter");
assert.equal(t("legacy:Weather"), "Wetter");
assert.equal(t("Hour"), "Stunde");
assert.equal(t("Feels"), "Gefühlt");
assert.equal(t("status.updated", { time: "17:05" }), "Aktualisiert 17:05");
assert.equal(
  t("search.none"),
  "Keine Orte gefunden. Versuche einen Ort in der Nähe.",
);
assert.equal(
  t("settings.useLocation", { name: "Graz" }),
  "Graz als Startort festlegen",
);
assert.equal(fmt(1234.5, 1).replace(/[\u00a0\u202f]/g, " "), "1 234,5");
const germanDate = time(Date.UTC(2026, 10, 25) / 1000, {
  day: "numeric",
  month: "short",
});

settings.language = "en";
assert.equal(currentLanguage(), "en");
assert.equal(t("nav.weather"), "Weather");
assert.equal(t("legacy:Weather"), "Weather");
assert.equal(t("Hour"), "Hour");
assert.equal(t("Feels"), "Feels");
assert.equal(t("status.updated", { time: "17:05" }), "Updated 17:05");
assert.equal(t("search.none"), "No locations found. Try a nearby town.");
assert.equal(
  t("settings.useLocation", { name: "Graz" }),
  "Use Graz as startup location",
);
assert.equal(fmt(1234.5, 1), "1,234.5");
const englishDate = time(Date.UTC(2026, 10, 25) / 1000, {
  day: "numeric",
  month: "short",
});
assert.notEqual(
  germanDate,
  englishDate,
  "short date order follows the selected locale",
);

console.log(
  "PASS: keyed catalogs, parameter interpolation, legacy bridge and German/English formats.",
);
