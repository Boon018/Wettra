import { settings, state } from "../app/state.js";
export { condition, forecastCondition } from "../weather/conditionLabel.js";
export const $ = (id) => document.getElementById(id);
export const finite = (v) => typeof v === "number" && Number.isFinite(v);
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const key = (l) =>
  Number(l.latitude).toFixed(3) + "," + Number(l.longitude).toFixed(3);
const locale = () => settings.language === "de" ? "de-AT" : "en-GB";
export const fmt = (n, d = 0) =>
  finite(n)
    ? n.toLocaleString(locale(), {
        maximumFractionDigits: d,
        minimumFractionDigits: d,
      })
    : "—";
export function unit(v, k) {
  if (!finite(v)) return null;
  if (k.includes("temperature"))
    return settings.temperature === "fahrenheit" ? (v * 9) / 5 + 32 : v;
  if (k.startsWith("wind_"))
    return settings.wind === "ms"
      ? v / 3.6
      : settings.wind === "mph"
        ? v / 1.609344
        : v;
  if (["precipitation", "rain"].includes(k))
    return settings.precipitation === "inch" ? v / 25.4 : v;
  return v;
}
export const temp = (v) => fmt(unit(v, "temperature_2m")) + "°";
export const wind = (v) =>
  fmt(unit(v, "wind_speed_10m")) +
  " " +
  { kmh: "km/h", ms: "m/s", mph: "mph" }[settings.wind];
export const rain = (v) =>
  fmt(unit(v, "precipitation"), settings.precipitation === "inch" ? 2 : 1) +
  " " +
  settings.precipitation;
export const direction = (v) =>
  finite(v)
    ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(v / 45) % 8]
    : "—";
export function time(t, opts = { hour: "2-digit", minute: "2-digit" }) {
  return finite(t)
    ? new Intl.DateTimeFormat(locale(), {
        ...opts,
        timeZone:
          state.data?.timezone || state.location.timezone || "Europe/Vienna",
      }).format(new Date(t * 1000))
    : "—";
}
export function dateKey(
  t,
  tz = state.data?.timezone || state.location.timezone || "Europe/Vienna",
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t * 1000));
}
