import { MODELS, forecastParams } from '../src/api/forecastSpec.js';
import { normalize } from '../src/weather/normalize.js';
import { consensus } from '../src/weather/core.js';
import { currentDisplayRow } from '../src/weather/conditions.js';
import { cacheKey } from './config.js';
export function validCache(data, location) {
  return data?.schema === 1 && data.location && cacheKey(data.location) === cacheKey(location) &&
    Number.isFinite(data.savedAt) && data.savedAt <= Date.now() + 60000 &&
    Array.isArray(data.rows) && data.rows.length > 0 &&
    data.rows.every(r => Number.isFinite(r.time) && Number.isFinite(r.temperature_2m));
}
export async function fetchForecast(location, request, now = Date.now()) {
  const ids = ['best_match', ...MODELS.map(m => m.id)];
  const results = await Promise.all(ids.map(async id => {
    try {
      const raw = await request(forecastParams(location, id, 2));
      return { id, raw, rows: normalize(raw) };
    } catch { return null; }
  }));
  const success = results.filter(Boolean);
  if (!success.length) throw Error('Wetterdienste nicht erreichbar');
  const base = success.find(r => r.id === 'best_match');
  const models = success.filter(r => r.id !== 'best_match');
  const rows = consensus(base, models, now / 1000);
  if (!rows.length) throw Error('Keine gültigen Wetterdaten');
  return { schema: 1, location, savedAt: now, rows,
    current: Number.isFinite(base?.raw.current?.time) && Number.isFinite(base?.raw.current?.temperature_2m) ? base.raw.current : null,
    failures: ids.filter((id, i) => !results[i]) };
}
export async function getWeather(location, io, now = Date.now(), force = false) {
  let cached;
  try { const value = await io.read(); if (validCache(value, location)) cached = value; } catch {}
  if (cached && !force && now - cached.savedAt < 30 * 60000) return { ...cached, cached: true };
  try {
    const data = await fetchForecast(location, io.request, now);
    try { await io.write(data); } catch { return { ...data, storageError: true }; }
    return data;
  } catch (error) {
    if (cached) return { ...cached, offline: true };
    throw error;
  }
}
export function widgetRows(data, now = Date.now() / 1000) {
  const currentHour = data.rows.find(r => r.time <= now && now - r.time < 3600);
  const hours = data.rows.filter(r => r.time > now).slice(0, 5);
  // Never relabel an old current estimate as present conditions.
  const freshCurrent = data.current && data.current.time <= now + 300 && now - data.current.time < 3600;
  const current = freshCurrent ? currentDisplayRow(data.current, data.rows) : currentHour;
  return { current, hours };
}
export function todaySummary(data, timezone, now = Date.now()) {
  const date = t => new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
  const day = date(now);
  const rows = data.rows.filter(r => date(r.time * 1000) === day);
  const temps = rows.map(r => r.temperature_2m).filter(Number.isFinite);
  const uv = rows.map(r => r.uv_index).filter(Number.isFinite);
  return { high: temps.length ? Math.max(...temps) : null, low: temps.length ? Math.min(...temps) : null,
    uv: uv.length ? Math.max(...uv) : null,
    amount: rows.length >= 23 && rows.every(r => Number.isFinite(r.precipitation)) ? rows.reduce((s,r)=>s+r.precipitation,0) : null };
}
