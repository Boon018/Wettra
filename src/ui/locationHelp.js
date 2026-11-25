import { $ } from "./format.js";
import { t } from "./i18n.js";
export function showLocationHelp(reason = "location.help.default") {
  const dialog = $("locationHelp");
  if (!dialog || typeof dialog.showModal !== "function") return;
  $("locationHelpReason").textContent = t(reason);
  if (!dialog.open) dialog.showModal();
}
export function closeLocationHelp() {
  const dialog = $("locationHelp");
  if (dialog && typeof dialog.close === "function") dialog.close();
}
