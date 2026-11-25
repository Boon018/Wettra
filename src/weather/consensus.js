import { finite, dateKey } from "../ui/format.js";
export { weightedMedian, weight, consensus } from "./core.js";
export function daily(rows) {
  const groups = new Map();
  for (const r of rows) {
    const k = dateKey(r.time);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  return [...groups].map(([date, rs]) => {
    const vals = (k) => rs.map((r) => r[k]).filter(finite),
      max = (k) => (vals(k).length ? Math.max(...vals(k)) : null);
    const ts = vals("temperature_2m"),
      ps = vals("precipitation");
    return {
      date,
      rows: rs,
      time: rs[0].time,
      // A day may contain forecast rows while every temperature value is
      // missing. Keep that state explicit instead of leaking +/-Infinity to
      // the UI and Scriptable consumers.
      low: ts.length ? Math.min(...ts) : null,
      high: ts.length ? Math.max(...ts) : null,
      precip: ps.length === rs.length ? ps.reduce((a, b) => a + b, 0) : null,
      prob: max("precipitation_probability"),
      wind: max("wind_speed_10m"),
      gust: max("wind_gusts_10m"),
      code: max("weather_code"),
      complete: rs.length >= 23,
    };
  });
}
