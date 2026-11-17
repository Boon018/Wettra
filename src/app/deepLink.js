import { widgetConfig } from '../weather/widgetConfig.js';
export function linkedLocation(search) {
  const p = new URLSearchParams(search);
  const lat = p.get('lat'), lon = p.get('lon');
  if (!lat?.trim() || !lon?.trim()) return null;
  const decimal = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if (!decimal.test(lat) || !decimal.test(lon)) return null;
  try {
    const c = widgetConfig({ name: p.get('name') || `${Number(lat).toFixed(3)}°, ${Number(lon).toFixed(3)}°`, latitude: Number(lat), longitude: Number(lon), timezone: p.get('tz') || 'Europe/Vienna' });
    return { name: c.name, latitude: c.latitude, longitude: c.longitude, timezone: c.timezone };
  } catch { return null; }
}
