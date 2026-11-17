import { CORE } from "../api/forecastSpec.js";
const finite = Number.isFinite;
export function weightedMedian(a) {
  if (!a.length) return null;
  const sorted = [...a].sort((a, b) => a.v - b.v),
    half = sorted.reduce((s, a) => s + a.w, 0) / 2;
  let s = 0;
  for (const a of sorted) {
    s += a.w;
    if (s >= half) return a.v;
  }
  return sorted.at(-1).v;
}
export function weight(id, lead) {
  return id === "icon_seamless"
    ? lead < 48
      ? 0.5
      : lead < 120
        ? 0.4
        : 0.25
    : id === "ecmwf_ifs025"
      ? lead < 48
        ? 0.3
        : 0.45
      : lead < 48
        ? 0.2
        : 0.3;
}
export function consensus(base, models, now = Date.now() / 1000) {
  const maps = models.map((m) => ({
    ...m,
    map: new Map(m.rows.map((r) => [r.time, r])),
  }));
  const times =
    base?.rows?.map((r) => r.time) ||
    [...new Set(models.flatMap((m) => m.rows.map((r) => r.time)))].sort(
      (a, b) => a - b,
    );
  const bm = new Map((base?.rows || []).map((r) => [r.time, r]));
  return times
    .map((t) => {
      const out = {
        ...(bm.get(t) || {}),
        time: t,
        contributors: 0,
        tempSpread: null,
      };
      for (const k of CORE) {
        const a = maps
          .map((m) => ({
            v: m.map.get(t)?.[k],
            w: weight(m.id, (t - now) / 3600),
          }))
          .filter((x) => finite(x.v));
        if (a.length) {
          out[k] = ["precipitation", "wind_gusts_10m"].includes(k)
            ? weightedMedian(a)
            : a.reduce((s, x) => s + x.v * x.w, 0) /
              a.reduce((s, x) => s + x.w, 0);
          if (k === "temperature_2m") {
            out.contributors = a.length;
            out.tempSpread =
              Math.max(...a.map((x) => x.v)) - Math.min(...a.map((x) => x.v));
          }
        } else if (!finite(out[k])) out[k] = null;
      }
      return out;
    })
    .filter((r) => finite(r.temperature_2m));
}
