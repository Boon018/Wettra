// Portable, versioned configuration shared by PWA and Scriptable.
export const WIDGET_VERSION = '0.2.0';
export const WIDGET_DEFAULT = { name: 'Graz', latitude: 47.0707, longitude: 15.4395, timezone: 'Europe/Vienna' };
export function widgetConfig(value = WIDGET_DEFAULT) {
  const c = typeof value === 'string' ? JSON.parse(value) : value;
  if (!c || (c.version !== undefined && c.version !== 1) ||
      typeof c.name !== 'string' || !c.name.trim() || c.name.length > 100 ||
      !Number.isFinite(c.latitude) || Math.abs(c.latitude) > 90 ||
      !Number.isFinite(c.longitude) || Math.abs(c.longitude) > 180)
    throw Error('Ungültiger Standortparameter');
  const timezone = c.timezone || 'Europe/Vienna';
  if (typeof timezone !== 'string') throw Error('Ungültige Zeitzone');
  new Intl.DateTimeFormat('de-AT', { timeZone: timezone }).format();
  const choice = (k, options, fallback) => {
    if (c[k] !== undefined && !options.includes(c[k])) throw Error('Ungültige Einheit: ' + k);
    return c[k] || fallback;
  };
  return { version: 1, name: c.name.trim(), latitude: c.latitude, longitude: c.longitude, timezone,
    temperature: choice('temperature', ['celsius','fahrenheit'], 'celsius'),
    wind: choice('wind', ['kmh','ms','mph'], 'kmh'),
    precipitation: choice('precipitation', ['mm','inch'], 'mm') };
}
export function widgetAppURL(config) {
  const c = widgetConfig(config);
  const params = { lat: c.latitude, lon: c.longitude, name: c.name, tz: c.timezone, pwa: 1 };
  return 'https://boon018.github.io/Wettra/?' + Object.entries(params).map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
}
