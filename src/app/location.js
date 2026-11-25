import { state } from "./state.js";
import { radar } from "../ui/radarView.js";
import { Store } from "../storage/storage.js";
import { loadWeather } from "../weather/forecast.js";
import { status } from "../ui/status.js";
import { $ } from "../ui/format.js";
import { validLocation } from "../storage/validate.js";
import { requestLocation } from "../api/geolocation.js";
import { showLocationHelp, closeLocationHelp } from "../ui/locationHelp.js";
import { t } from "../ui/i18n.js";
let cancelGPS = null;
export function selectLocation(l) {
  if (!validLocation(l)) {
    locationMessage("location.invalid");
    return;
  }
  if (cancelGPS) {
    cancelGPS();
    cancelGPS = null;
  }
  state.locationEpoch++;
  state.historyRequest++;
  state.radarRequest++;
  state.radar = null;
  state.radarBusy = false;
  state.radarError = "";
  state.gpsMessage = "";
  state.history = null;
  state.compare = null;
  state.histBusy = false;
  state.busy = false;
  state.location = {
    name: l.name,
    latitude: l.latitude,
    longitude: l.longitude,
    country: l.country || "",
    timezone: l.timezone || "Europe/Vienna",
  };
  Store.set("location", state.location);
  state.view = "weather";
  state.search = [];
  loadWeather();
  if (state.radarOpened) radar();
}
export function locationMessage(messageKey, helpKey = messageKey) {
  state.gpsMessage = helpKey;
  const message = t(messageKey);
  status(messageKey, true);
  if ($("locationMessage")) $("locationMessage").textContent = message;
}
export function gps() {
  closeLocationHelp();
  if (cancelGPS) cancelGPS();
  if (!navigator.geolocation || location.protocol === "file:") {
    locationMessage("location.unavailable");
    return;
  }
  locationMessage("location.requesting");
  const request = ++state.gpsRequest,
    epoch = state.locationEpoch;
  const current = () =>
    request === state.gpsRequest && epoch === state.locationEpoch;
  let pending = true;
  const cancel = requestLocation(
    navigator.geolocation,
    (p) => {
      if (!current()) return;
      pending = false;
      cancelGPS = null;
      selectLocation({
        name:
          "My location · " +
          p.coords.latitude.toFixed(2) +
          "°, " +
          p.coords.longitude.toFixed(2) +
          "°",
        latitude: +p.coords.latitude.toFixed(4),
        longitude: +p.coords.longitude.toFixed(4),
        country: "",
        timezone: "Europe/Vienna",
      });
    },
    (e) => {
      if (!current()) return;
      pending = false;
      cancelGPS = null;
      const reason =
        e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "failure";
      locationMessage(`location.error.${reason}`, `location.${reason}`);
      const reasonKey = `location.${reason}`;
      showLocationHelp(reasonKey);
    },
  );
  cancelGPS = pending ? cancel : null;
}
if (typeof document.addEventListener === "function")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && cancelGPS) {
      cancelGPS();
      cancelGPS = null;
      locationMessage("location.paused");
    }
  });
