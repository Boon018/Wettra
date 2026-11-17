export const value = (v, suffix = '', digits = 0) => Number.isFinite(v) ? v.toFixed(digits).replace('.', ',') + suffix : '—';
export const temperature = (v, c) => value(Number.isFinite(v) && c.temperature === 'fahrenheit' ? v * 9 / 5 + 32 : v, '°');
export const rainfall = (v, c) => value(Number.isFinite(v) && c.precipitation === 'inch' ? v / 25.4 : v, c.precipitation === 'inch' ? ' in' : ' mm', c.precipitation === 'inch' ? 2 : 1);
export const windSpeed = (v, c) => value(Number.isFinite(v) ? c.wind === 'ms' ? v / 3.6 : c.wind === 'mph' ? v / 1.609344 : v : v, {kmh:' km/h',ms:' m/s',mph:' mph'}[c.wind || 'kmh']);
