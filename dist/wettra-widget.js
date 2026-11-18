// Wettra Widget 0.2.0 · Weather: Open-Meteo (CC BY 4.0)
// https://open-meteo.com/ · https://boon018.github.io/Wettra/
// src/weather/widgetConfig.js
var WIDGET_VERSION = "0.2.0";
var WIDGET_DEFAULT = { name: "Graz", latitude: 47.0707, longitude: 15.4395, timezone: "Europe/Vienna" };
function widgetConfig(value2 = WIDGET_DEFAULT) {
  const c = typeof value2 === "string" ? JSON.parse(value2) : value2;
  if (!c || c.version !== void 0 && c.version !== 1 || typeof c.name !== "string" || !c.name.trim() || c.name.length > 100 || !Number.isFinite(c.latitude) || Math.abs(c.latitude) > 90 || !Number.isFinite(c.longitude) || Math.abs(c.longitude) > 180)
    throw Error("Ung\xFCltiger Standortparameter");
  const timezone = c.timezone || "Europe/Vienna";
  if (typeof timezone !== "string") throw Error("Ung\xFCltige Zeitzone");
  new Intl.DateTimeFormat("de-AT", { timeZone: timezone }).format();
  const choice = (k, options, fallback) => {
    if (c[k] !== void 0 && !options.includes(c[k])) throw Error("Ung\xFCltige Einheit: " + k);
    return c[k] || fallback;
  };
  return {
    version: 1,
    name: c.name.trim(),
    latitude: c.latitude,
    longitude: c.longitude,
    timezone,
    temperature: choice("temperature", ["celsius", "fahrenheit"], "celsius"),
    wind: choice("wind", ["kmh", "ms", "mph"], "kmh"),
    precipitation: choice("precipitation", ["mm", "inch"], "mm")
  };
}
function widgetAppURL(config2) {
  const c = widgetConfig(config2);
  const params = { lat: c.latitude, lon: c.longitude, name: c.name, tz: c.timezone, pwa: 1 };
  return "https://boon018.github.io/Wettra/?" + Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}

// widget/config.js
var VERSION = WIDGET_VERSION;
var DEFAULT = WIDGET_DEFAULT;
var parseConfig = (value2) => widgetConfig(value2 || DEFAULT);
var cacheKey = (l) => `${l.latitude.toFixed(5)}_${l.longitude.toFixed(5)}`;

// src/api/forecastSpec.js
var CORE = [
  "temperature_2m",
  "precipitation",
  "wind_speed_10m",
  "wind_gusts_10m",
  "pressure_msl",
  "cloud_cover"
];
var EXTRA = [
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation_probability",
  "rain",
  "snowfall",
  "weather_code",
  "wind_direction_10m",
  "visibility",
  "uv_index",
  "is_day"
];
var MODELS = [
  {
    id: "icon_seamless",
    name: "DWD ICON",
    detail: "D2 \u2192 EU \u2192 Global \xB7 up to 7.5 days",
    horizon: 180
  },
  {
    id: "ecmwf_ifs025",
    name: "ECMWF IFS 0.25\xB0",
    detail: "Global \xB7 up to 15 days",
    horizon: 360
  },
  {
    id: "gfs_seamless",
    name: "NOAA GFS",
    detail: "Global \xB7 up to 16 days",
    horizon: 384
  }
];
function forecastParams(l, model, days = 16) {
  const p = {
    latitude: l.latitude,
    longitude: l.longitude,
    timezone: "auto",
    timeformat: "unixtime",
    forecast_days: days,
    models: model,
    hourly: (model === "best_match" ? [...CORE, ...EXTRA] : CORE).join(",")
  };
  if (model === "best_match") {
    p.current = [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "is_day"
    ].join(",");
    p.daily = "sunrise,sunset,uv_index_max,weather_code";
  }
  return p;
}

// src/weather/normalize.js
var finite = Number.isFinite;
function normalize(d) {
  if (!d || !d.hourly || !Array.isArray(d.hourly.time) || !d.hourly.time.length)
    throw Error("Incomplete weather response");
  if (!d.hourly.temperature_2m?.some(finite))
    throw Error("No temperature data available");
  return d.hourly.time.map((t, i) => {
    if (!finite(t)) throw Error("Invalid weather timestamp");
    const row = { time: t };
    for (const [k, a] of Object.entries(d.hourly)) {
      if (k !== "time") row[k] = Array.isArray(a) && finite(a[i]) ? a[i] : null;
    }
    return row;
  });
}

// src/weather/core.js
var finite2 = Number.isFinite;
function weightedMedian(a) {
  if (!a.length) return null;
  const sorted = [...a].sort((a2, b) => a2.v - b.v), half = sorted.reduce((s2, a2) => s2 + a2.w, 0) / 2;
  let s = 0;
  for (const a2 of sorted) {
    s += a2.w;
    if (s >= half) return a2.v;
  }
  return sorted.at(-1).v;
}
function weight(id, lead) {
  return id === "icon_seamless" ? lead < 48 ? 0.5 : lead < 120 ? 0.4 : 0.25 : id === "ecmwf_ifs025" ? lead < 48 ? 0.3 : 0.45 : lead < 48 ? 0.2 : 0.3;
}
function consensus(base, models, now = Date.now() / 1e3) {
  const maps = models.map((m) => ({
    ...m,
    map: new Map(m.rows.map((r) => [r.time, r]))
  }));
  const times = base?.rows?.map((r) => r.time) || [...new Set(models.flatMap((m) => m.rows.map((r) => r.time)))].sort(
    (a, b) => a - b
  );
  const bm = new Map((base?.rows || []).map((r) => [r.time, r]));
  return times.map((t) => {
    const out = {
      ...bm.get(t) || {},
      time: t,
      contributors: 0,
      tempSpread: null
    };
    for (const k of CORE) {
      const a = maps.map((m) => ({
        v: m.map.get(t)?.[k],
        w: weight(m.id, (t - now) / 3600)
      })).filter((x) => finite2(x.v));
      if (a.length) {
        out[k] = ["precipitation", "wind_gusts_10m"].includes(k) ? weightedMedian(a) : a.reduce((s, x) => s + x.v * x.w, 0) / a.reduce((s, x) => s + x.w, 0);
        if (k === "temperature_2m") {
          out.contributors = a.length;
          out.tempSpread = Math.max(...a.map((x) => x.v)) - Math.min(...a.map((x) => x.v));
        }
      } else if (!finite2(out[k])) out[k] = null;
    }
    return out;
  }).filter((r) => finite2(r.temperature_2m));
}

// src/weather/conditions.js
var ordinaryRain = /* @__PURE__ */ new Set([51, 53, 55, 61, 63, 65, 80, 81, 82]);
function displayWeatherCode(row = {}) {
  const {
    weather_code: code,
    precipitation: amount,
    precipitation_probability: probability,
    cloud_cover: cloud
  } = row;
  if (!ordinaryRain.has(code) || !Number.isFinite(amount) || amount < 0 || amount >= 0.05 || !Number.isFinite(probability) || probability < 0 || probability >= 40)
    return code;
  if (!Number.isFinite(cloud) || cloud < 0 || cloud > 100) return 3;
  return cloud < 10 ? 0 : cloud < 30 ? 1 : cloud < 80 ? 2 : 3;
}
function currentDisplayRow(current, rows) {
  if (!Number.isFinite(current?.time)) return current;
  const hour = rows.filter(
    (r) => Number.isFinite(r.time) && r.time <= current.time && current.time - r.time < 3600
  ).reduce((a, b) => !a || b.time > a.time ? b : a, null);
  return {
    ...current,
    precipitation_probability: hour?.precipitation_probability
  };
}

// widget/weather.js
function validCache(data, location) {
  return data?.schema === 1 && data.location && cacheKey(data.location) === cacheKey(location) && Number.isFinite(data.savedAt) && data.savedAt <= Date.now() + 6e4 && Array.isArray(data.rows) && data.rows.length > 0 && data.rows.every((r) => Number.isFinite(r.time) && Number.isFinite(r.temperature_2m));
}
async function fetchForecast(location, request, now = Date.now()) {
  const ids = ["best_match", ...MODELS.map((m) => m.id)];
  const results = await Promise.all(ids.map(async (id) => {
    try {
      const raw = await request(forecastParams(location, id, 2));
      return { id, raw, rows: normalize(raw) };
    } catch {
      return null;
    }
  }));
  const success = results.filter(Boolean);
  if (!success.length) throw Error("Wetterdienste nicht erreichbar");
  const base = success.find((r) => r.id === "best_match");
  const models = success.filter((r) => r.id !== "best_match");
  const rows = consensus(base, models, now / 1e3);
  if (!rows.length) throw Error("Keine g\xFCltigen Wetterdaten");
  return {
    schema: 1,
    location,
    savedAt: now,
    rows,
    current: Number.isFinite(base?.raw.current?.time) && Number.isFinite(base?.raw.current?.temperature_2m) ? base.raw.current : null,
    failures: ids.filter((id, i) => !results[i])
  };
}
async function getWeather(location, io, now = Date.now(), force = false) {
  let cached;
  try {
    const value2 = await io.read();
    if (validCache(value2, location)) cached = value2;
  } catch {
  }
  if (cached && !force && now - cached.savedAt < 30 * 6e4) return { ...cached, cached: true };
  try {
    const data = await fetchForecast(location, io.request, now);
    try {
      await io.write(data);
    } catch {
      return { ...data, storageError: true };
    }
    return data;
  } catch (error) {
    if (cached) return { ...cached, offline: true };
    throw error;
  }
}
function widgetRows(data, now = Date.now() / 1e3) {
  const currentHour = data.rows.find((r) => r.time <= now && now - r.time < 3600);
  const hours = data.rows.filter((r) => r.time > now).slice(0, 5);
  const freshCurrent = data.current && data.current.time <= now + 300 && now - data.current.time < 3600;
  const current = freshCurrent ? currentDisplayRow(data.current, data.rows) : currentHour;
  return { current, hours };
}
function todaySummary(data, timezone, now = Date.now()) {
  const date = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));
  const day = date(now);
  const rows = data.rows.filter((r) => date(r.time * 1e3) === day);
  const temps = rows.map((r) => r.temperature_2m).filter(Number.isFinite);
  const uv = rows.map((r) => r.uv_index).filter(Number.isFinite);
  return {
    high: temps.length ? Math.max(...temps) : null,
    low: temps.length ? Math.min(...temps) : null,
    uv: uv.length ? Math.max(...uv) : null,
    amount: rows.length >= 23 && rows.every((r) => Number.isFinite(r.precipitation)) ? rows.reduce((s, r) => s + r.precipitation, 0) : null
  };
}

// widget/io.js
function storageAndNetwork(location) {
  const fm = FileManager.local();
  const directory = fm.joinPath(fm.libraryDirectory(), "Alpenwetter");
  if (!fm.fileExists(directory)) fm.createDirectory(directory, true);
  const file = fm.joinPath(directory, cacheKey(location) + ".json");
  return {
    read: () => {
      for (const candidate of [file, file + ".backup"]) {
        try {
          if (fm.fileExists(candidate)) return JSON.parse(fm.readString(candidate));
        } catch {
        }
      }
      return null;
    },
    write: (data) => {
      const tmp = file + ".tmp";
      fm.writeString(tmp, JSON.stringify(data));
      JSON.parse(fm.readString(tmp));
      const backup = file + ".backup";
      if (fm.fileExists(backup)) fm.remove(backup);
      if (fm.fileExists(file)) fm.move(file, backup);
      try {
        fm.move(tmp, file);
      } catch (error) {
        if (fm.fileExists(backup)) fm.move(backup, file);
        throw error;
      }
    },
    request: async (params) => {
      const query = Object.entries(params).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
      const req = new Request("https://api.open-meteo.com/v1/forecast?" + query);
      req.timeoutInterval = 12;
      const data = await req.loadJSON();
      if (req.response?.statusCode !== 200 || data?.error) throw Error("Wetterdienst nicht verf\xFCgbar");
      return data;
    }
  };
}

// src/weather/conditionLabel.js
var finite3 = Number.isFinite;
function condition(c, day = 1) {
  if (!finite3(c)) return ["\u25CC", "Unavailable"];
  if (c === 0) return [day ? "\u2600\uFE0F" : "\u{1F319}", "Clear sky"];
  if (c <= 2)
    return [day ? "\u{1F324}\uFE0F" : "\u2601\uFE0F", c === 1 ? "Mostly clear" : "Partly cloudy"];
  if (c === 3) return ["\u2601\uFE0F", "Overcast"];
  if (c <= 48) return ["\u{1F32B}\uFE0F", "Fog"];
  if (c <= 57) return ["\u{1F326}\uFE0F", "Drizzle"];
  if (c <= 67) return ["\u{1F327}\uFE0F", c >= 66 ? "Freezing rain" : "Rain"];
  if (c <= 77) return ["\u{1F328}\uFE0F", "Snow"];
  if (c <= 82) return ["\u{1F326}\uFE0F", "Rain showers"];
  if (c <= 86) return ["\u{1F328}\uFE0F", "Snow showers"];
  return ["\u26C8\uFE0F", "Thunderstorm"];
}
function forecastCondition(row = {}) {
  const code = displayWeatherCode(row);
  if (code !== row.weather_code && (!finite3(row.cloud_cover) || row.cloud_cover < 0 || row.cloud_cover > 100))
    return ["\u2601\uFE0F", "Mostly dry"];
  return condition(code, row.is_day);
}

// widget/format.js
var value = (v, suffix = "", digits = 0) => Number.isFinite(v) ? v.toFixed(digits).replace(".", ",") + suffix : "\u2014";
var temperature = (v, c) => value(Number.isFinite(v) && c.temperature === "fahrenheit" ? v * 9 / 5 + 32 : v, "\xB0");
var rainfall = (v, c) => value(Number.isFinite(v) && c.precipitation === "inch" ? v / 25.4 : v, c.precipitation === "inch" ? " in" : " mm", c.precipitation === "inch" ? 2 : 1);
var windSpeed = (v, c) => value(Number.isFinite(v) ? c.wind === "ms" ? v / 3.6 : c.wind === "mph" ? v / 1.609344 : v : v, { kmh: " km/h", ms: " m/s", mph: " mph" }[c.wind || "kmh"]);

// widget/renderer.js
var labels = { "Unavailable": "Nicht verf\xFCgbar", "Clear sky": "Klar", "Mostly clear": "\xDCberwiegend klar", "Partly cloudy": "Leicht bew\xF6lkt", "Overcast": "Bedeckt", "Fog": "Nebel", "Drizzle": "Nieselregen", "Freezing rain": "Gefrierender Regen", "Rain": "Regen", "Snow": "Schnee", "Rain showers": "Regenschauer", "Snow showers": "Schneeschauer", "Thunderstorm": "Gewitter", "Mostly dry": "\xDCberwiegend trocken" };
var clock = (t, location) => new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: location.timezone }).format(new Date(t * 1e3));
function text(parent, label, size = 12, muted = false) {
  const t = parent.addText(String(label));
  t.font = Font.systemFont(size);
  t.textColor = new Color(muted ? "A9C5D4" : "F4FAFC");
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.65;
  return t;
}
function shell(location, small = false, summary = "") {
  const w = new ListWidget();
  w.backgroundColor = new Color("102A3B");
  w.setPadding(13, 14, 12, 14);
  w.url = widgetAppURL(location);
  w.refreshAfterDate = new Date(Date.now() + 30 * 6e4);
  if (small || !summary) text(w, small ? location.name : "WETTRA \xB7 " + location.name, 12, true);
  else {
    const header = w.addStack();
    header.centerAlignContent();
    header.spacing = 5;
    text(header, "WETTRA \xB7 " + location.name, 11, true);
    header.addSpacer();
    text(header, summary, 10, true);
  }
  return w;
}
function footer(w, data, location, small) {
  w.addSpacer();
  const age = Date.now() - data.savedAt;
  const status = data.offline ? "Offline \xB7 " : age > 36e5 ? "Veraltet \xB7 " : data.storageError ? "Nicht gespeichert \xB7 " : data.failures?.length ? "Teilweise \xB7 " : "";
  const stamp = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: location.timezone }).format(new Date(data.savedAt));
  if (small) {
    text(w, status + stamp, 9, true);
    text(w, "Open-Meteo", 8, true);
  } else {
    text(w, status + stamp + " \xB7 Open-Meteo \xB7 Widget " + VERSION, 8, true);
  }
}
function renderWidget(data, location, family = "medium") {
  const small = family === "small", large = ["large", "extraLarge"].includes(family);
  const { current, hours } = widgetRows(data);
  const summary = todaySummary(data, location.timezone);
  const condition2 = forecastCondition(current || {});
  const chance = Number.isFinite(current?.precipitation_probability) ? value(current.precipitation_probability, " % Regen") : "";
  const headline = !small && !large ? [labels[condition2[1]], chance].filter(Boolean).join(" \xB7 ") : "";
  const w = shell(location, small, headline);
  const row = w.addStack();
  row.centerAlignContent();
  row.spacing = 10;
  text(row, current ? condition2[0] : "\u25CC", small ? 24 : 28);
  text(row, temperature(current?.temperature_2m, location), small ? 32 : 36);
  if (small) {
    text(w, labels[condition2[1]], 12, true);
    text(w, value(current?.precipitation_probability, " % Regen"), 12);
    footer(w, data, location, true);
    return w;
  }
  row.addSpacer();
  const info = row.addStack();
  info.layoutVertically();
  text(info, rainfall(current?.precipitation, location), 12, true);
  if (large) {
    text(w, "Heute  \u2191 " + temperature(summary.high, location) + "  \u2193 " + temperature(summary.low, location), 15);
    w.addSpacer(15);
    text(w, "N\xC4CHSTE STUNDEN", 11, true);
    w.addSpacer(8);
  } else w.addSpacer(5);
  const hourly = w.addStack();
  for (let i = 0; i < hours.length; i++) {
    if (i) hourly.addSpacer();
    const col = hourly.addStack();
    col.layoutVertically();
    col.spacing = large ? 5 : 2;
    const r = hours[i];
    text(col, clock(r.time, location), 10, true);
    if (large) {
      text(col, forecastCondition(r)[0], 23);
      text(col, temperature(r.temperature_2m, location), 14);
    } else {
      text(col, forecastCondition(r)[0], 20);
      text(col, temperature(r.temperature_2m, location), 13);
    }
    text(col, value(r.precipitation_probability, "%"), 11, true);
    if (large) text(col, rainfall(r.precipitation, location), 10, true);
  }
  if (!hours.length) text(w, "Keine kommenden Stunden gespeichert", 11, true);
  if (large) {
    w.addSpacer(16);
    text(w, "Niederschlag heute  " + rainfall(summary.amount, location), 14);
    text(w, "Wind  " + windSpeed(current?.wind_speed_10m, location), 14);
    text(w, "UV heute max.  " + value(summary.uv, "", 1), 14);
    w.addSpacer(8);
    text(w, "Stundenwerte: Modellkonsens \xB7 Mengen je Stunde", 10, true);
  }
  footer(w, data, location, false);
  return w;
}
function errorWidget(location, message) {
  const w = shell(location);
  w.addSpacer();
  text(w, "Wetter nicht verf\xFCgbar", 16);
  const t = text(w, message, 12, true);
  t.lineLimit = 3;
  w.addSpacer();
  text(w, "Wettra Widget " + VERSION, 10, true);
  return w;
}

// widget/main.js
async function main() {
  let location = DEFAULT, widget;
  try {
    location = parseConfig(args.widgetParameter);
    const data = await getWeather(location, storageAndNetwork(location), Date.now(), !config.runsInWidget);
    widget = renderWidget(data, location, config.widgetFamily || "medium");
  } catch (error) {
    widget = errorWidget(location, error.message || "Bitte sp\xE4ter erneut versuchen.");
  }
  Script.setWidget(widget);
  if (!config.runsInWidget) await widget.presentMedium();
  Script.complete();
}
await main();
