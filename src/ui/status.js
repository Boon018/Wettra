import { $, time } from "./format.js";
import { state, settings } from "../app/state.js";
import { Store } from "../storage/storage.js";
import { t } from "./i18n.js";
export function status(message, error = false, params = {}) {
  $("status").textContent = t(message, params);
  $("status").className = "status" + (error ? " error" : "");
}
export function updated() {
  if (state.error) {
    if (typeof state.error === "string") return status(state.error, true);
    return status(state.error.key, true, state.error.params);
  }
  if (state.data) {
    const age = Date.now() - state.data.savedAt;
    const parts = [];
    if (!navigator.onLine) parts.push(t("status.offline"));
    else if (age > settings.refresh * 60000) parts.push(t("status.cached"));
    parts.push(t("status.updated", { time: time(state.data.savedAt / 1000) }));
    if (age > 86400000)
      parts.push(
        t("status.updated.date", {
          date: time(state.data.savedAt / 1000, {
            day: "numeric",
            month: "short",
          }),
        }),
      );
    if (Store.blocked) parts.push(t("status.storageUnavailable"));
    status(parts.join(" · "));
  }
}
