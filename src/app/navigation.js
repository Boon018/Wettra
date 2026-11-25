import { settings, state } from "./state.js";
import { $ } from "../ui/format.js";
import { weatherView } from "../ui/weatherView.js";
import { hourlyView, drawChart } from "../ui/charts.js";
import { historyView } from "../ui/historyView.js";
import { modelView } from "../ui/modelsView.js";
import { locationsView } from "../ui/locationsView.js";
import { settingsView } from "../ui/settingsView.js";
import { updated } from "../ui/status.js";
import { bind } from "./events.js";
import { localizeDOM, watchLocalization, t } from "../ui/i18n.js";
export const NAV = [
  ["weather", "☀", "nav.weather"],
  ["hourly", "◷", "nav.hourly"],
  ["history", "↶", "nav.history"],
  ["models", "≋", "nav.models"],
  ["locations", "⌖", "nav.places"],
  ["settings", "⚙", "nav.settings"],
];
export function render() {
  document.body.dataset.theme = settings.theme;
  $("locationTitle").textContent = state.location.name;
  $("nav").setAttribute("aria-label", t("nav.main"));
  $("nav").innerHTML = NAV.map(
    ([id, icon, title]) =>
      '<button data-view="' +
      id +
      '" ' +
      (state.view === id ? 'aria-current="page"' : "") +
      '><span aria-hidden="true">' +
      icon +
      "</span>" +
      t(title) +
      "</button>",
  ).join("");
  $("main").innerHTML = {
    weather: weatherView,
    hourly: hourlyView,
    history: historyView,
    models: modelView,
    locations: locationsView,
    settings: settingsView,
  }[state.view]();
  localizeDOM(document.body);
  if (state.gpsMessage && $("locationHelp")?.open)
    $("locationHelpReason").textContent = t(state.gpsMessage);
  watchLocalization();
  $("refresh").disabled = state.busy;
  updated();
  bind();
  if (state.view === "hourly" || (state.view === "history" && state.history))
    drawChart();
}
