import { forecastCondition } from '../src/weather/conditionLabel.js';
import { widgetAppURL } from '../src/weather/widgetConfig.js';
import { widgetRows, todaySummary } from './weather.js';
import { VERSION } from './config.js';
import { value, temperature, rainfall, windSpeed } from './format.js';
const labels = { 'Unavailable':'Nicht verfügbar', 'Clear sky':'Klar', 'Mostly clear':'Überwiegend klar', 'Partly cloudy':'Leicht bewölkt', 'Overcast':'Bedeckt', 'Fog':'Nebel', 'Drizzle':'Nieselregen', 'Freezing rain':'Gefrierender Regen', 'Rain':'Regen', 'Snow':'Schnee', 'Rain showers':'Regenschauer', 'Snow showers':'Schneeschauer', 'Thunderstorm':'Gewitter', 'Mostly dry':'Überwiegend trocken' };
const clock = (t, location) => new Intl.DateTimeFormat('de-AT', {hour:'2-digit',minute:'2-digit',timeZone:location.timezone}).format(new Date(t * 1000));
function text(parent, label, size = 12, muted = false) {
  const t = parent.addText(String(label));
  t.font = Font.systemFont(size); t.textColor = new Color(muted ? 'A9C5D4' : 'F4FAFC');
  t.lineLimit = 1; t.minimumScaleFactor = 0.65;
  return t;
}
function shell(location, small = false, summary = '') {
  const w = new ListWidget();
  w.backgroundColor = new Color('102A3B'); w.setPadding(13, 14, 12, 14);
  w.url = widgetAppURL(location);
  w.refreshAfterDate = new Date(Date.now() + 30 * 60000);
  if (small || !summary) text(w, small ? location.name : 'WETTRA · ' + location.name, 12, true);
  else {
    const header = w.addStack(); header.centerAlignContent(); header.spacing = 5;
    text(header, 'WETTRA · ' + location.name, 11, true);
    header.addSpacer();
    text(header, summary, 10, true);
  }
  return w;
}
function footer(w, data, location, small) {
  w.addSpacer();
  const age = Date.now() - data.savedAt;
  const status = data.offline ? 'Offline · ' : age > 3600000 ? 'Veraltet · ' : data.storageError ? 'Nicht gespeichert · ' : data.failures?.length ? 'Teilweise · ' : '';
  const stamp = new Intl.DateTimeFormat('de-AT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:location.timezone}).format(new Date(data.savedAt));
  if (small) {
    text(w, status + stamp, 9, true);
    text(w, 'Open-Meteo', 8, true);
  } else {
    text(w, status + stamp + ' · Open-Meteo · Widget ' + VERSION, 8, true);
  }
}
export function renderWidget(data, location, family = 'medium') {
  const small = family === 'small', large = ['large','extraLarge'].includes(family);
  const { current, hours } = widgetRows(data);
  const summary = todaySummary(data, location.timezone);
  const condition = forecastCondition(current || {});
  const chance = Number.isFinite(current?.precipitation_probability)
    ? value(current.precipitation_probability, ' % Regen')
    : '';
  const headline = !small && !large
    ? [labels[condition[1]], chance].filter(Boolean).join(' · ')
    : '';
  const w = shell(location, small, headline);
  const row = w.addStack(); row.centerAlignContent(); row.spacing = 10;
  text(row, current ? condition[0] : '◌', small ? 24 : 28);
  text(row, temperature(current?.temperature_2m, location), small ? 32 : 36);
  if (small) {
    text(w, labels[condition[1]], 12, true);
    text(w, value(current?.precipitation_probability, ' % Regen'), 12);
    footer(w, data, location, true);
    return w;
  }
  row.addSpacer();
  const info = row.addStack(); info.layoutVertically();
  text(info, rainfall(current?.precipitation, location), 12, true);
  if (large) {
    text(w, 'Heute  ↑ ' + temperature(summary.high, location) + '  ↓ ' + temperature(summary.low, location), 15);
    w.addSpacer(15); text(w, 'NÄCHSTE STUNDEN', 11, true); w.addSpacer(8);
  } else w.addSpacer(5);
  const hourly = w.addStack();
  for (let i = 0; i < hours.length; i++) {
    if (i) hourly.addSpacer();
    const col = hourly.addStack(); col.layoutVertically(); col.spacing = large ? 5 : 2;
    const r = hours[i];
    text(col, clock(r.time, location), 10, true);
    if (large) {
      text(col, forecastCondition(r)[0], 23);
      text(col, temperature(r.temperature_2m, location), 14);
    } else {
      text(col, forecastCondition(r)[0], 20);
      text(col, temperature(r.temperature_2m, location), 13);
    }
    text(col, value(r.precipitation_probability, '%'), 11, true);
    if (large) text(col, rainfall(r.precipitation, location), 10, true);
  }
  if (!hours.length) text(w, 'Keine kommenden Stunden gespeichert', 11, true);
  if (large) {
    w.addSpacer(16);
    text(w, 'Niederschlag heute  ' + rainfall(summary.amount, location), 14);
    text(w, 'Wind  ' + windSpeed(current?.wind_speed_10m, location), 14);
    text(w, 'UV heute max.  ' + value(summary.uv, '', 1), 14);
    w.addSpacer(8);
    text(w, 'Stundenwerte: Modellkonsens · Mengen je Stunde', 10, true);
  }
  footer(w, data, location, false);
  return w;
}
export function errorWidget(location, message) {
  const w = shell(location); w.addSpacer();
  text(w, 'Wetter nicht verfügbar', 16);
  const t = text(w, message, 12, true); t.lineLimit = 3;
  w.addSpacer(); text(w, 'Wettra Widget ' + VERSION, 10, true);
  return w;
}
