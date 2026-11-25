import { state } from "../app/state.js";
import { key, esc, time } from "./format.js";
import { render } from "../app/navigation.js";
import { radarMetadata } from "../api/rainViewer.js";
import { RadarMap } from "../radar/map.js";
import { normalizedPoint } from "../radar/projection.js";
import { t } from "./i18n.js";
let widget = null;
export function radarContent() {
  return (
    '<p class="muted">' +
    t("radar.entry.description", { name: esc(state.location.name) }) +
    '</p><button class="radar-open" data-action="radar">' +
    t("radar.entry.open") +
    '</button><p class="footnote">' +
    t("radar.entry.privacy") +
    "</p>"
  );
}
export function radarScreen() {
  return (
    '<section class="radar-screen"><div class="sectionhead radar-heading"><div><h2>' +
    t("radar.title") +
    '</h2><p class="muted">' +
    t("radar.subtitle", { name: esc(state.location.name) }) +
    '</p></div><button type="button" data-action="radarRefresh" aria-label="' +
    t("radar.refresh") +
    '">↻</button></div><div class="radar-nav-actions"><button type="button" data-action="closeRadar">← ' +
    t("radar.back") +
    '</button><span class="tag">' +
    t("radar.pastOnly") +
    '</span></div>' +
    (state.radarError
      ? '<p class="notice warning" role="alert">' +
        esc(t(state.radarError)) +
        "</p>"
      : "") +
    '<div id="radarMount"></div><p class="footnote radar-source">' +
    t("radar.source") +
    ' <a href="https://www.rainviewer.com/weather-radar-map-live.html" target="_blank" rel="noreferrer">RainViewer ↗</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></p></section>'
  );
}
export function radarImages() {
  const host = document.getElementById("radarMount");
  // VM regression harnesses intentionally do not emulate layout or DOM attachment.
  if (!host || !host.append || state.view !== "radar") {
    if (widget) {
      widget.destroy();
      widget = null;
    }
    return;
  }
  const locationKey = key(state.location);
  if (widget && widget.view.locationKey !== locationKey) {
    widget.destroy();
    widget = null;
  }
  if (!state.radarMap || state.radarMap.locationKey !== locationKey)
    state.radarMap = {
      locationKey,
      ...normalizedPoint(state.location.latitude, state.location.longitude),
      z: 7,
      opacity: 76,
    };
  if (!widget)
    widget = new RadarMap(
      state.radarMap,
      () => ({
        location: state.location,
        radar: state.radar,
        index: state.radarIndex,
        busy: state.radarBusy,
        error: state.radarError,
      }),
      (index) => {
        state.radarIndex = index;
      },
      time,
    );
  widget.attach(host);
}
export async function radar() {
  if (state.radarBusy) return;
  const request = ++state.radarRequest,
    locationKey = key(state.location);
  state.view = "radar";
  state.radarOpened = true;
  state.radarBusy = true;
  state.radarError = "";
  render();
  try {
    const data = await radarMetadata();
    if (request !== state.radarRequest || locationKey !== key(state.location))
      return;
    state.radar = { ...data, locationKey };
    state.radarIndex = data.frames.length - 1;
  } catch {
    if (request === state.radarRequest) state.radarError = "radar.failure";
  } finally {
    if (request === state.radarRequest) {
      state.radarBusy = false;
      if (state.view === "radar") render();
    }
  }
}
