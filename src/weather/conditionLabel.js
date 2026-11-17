import { displayWeatherCode } from "./conditions.js";
const finite = Number.isFinite;
export function condition(c, day = 1) {
  if (!finite(c)) return ["◌", "Unavailable"];
  if (c === 0) return [day ? "☀️" : "🌙", "Clear sky"];
  if (c <= 2)
    return [day ? "🌤️" : "☁️", c === 1 ? "Mostly clear" : "Partly cloudy"];
  if (c === 3) return ["☁️", "Overcast"];
  if (c <= 48) return ["🌫️", "Fog"];
  if (c <= 57) return ["🌦️", "Drizzle"];
  if (c <= 67) return ["🌧️", c >= 66 ? "Freezing rain" : "Rain"];
  if (c <= 77) return ["🌨️", "Snow"];
  if (c <= 82) return ["🌦️", "Rain showers"];
  if (c <= 86) return ["🌨️", "Snow showers"];
  return ["⛈️", "Thunderstorm"];
}
export function forecastCondition(row = {}) {
  const code = displayWeatherCode(row);
  if (
    code !== row.weather_code &&
    (!finite(row.cloud_cover) || row.cloud_cover < 0 || row.cloud_cover > 100)
  )
    return ["☁️", "Mostly dry"];
  return condition(code, row.is_day);
}
