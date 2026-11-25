import { json } from "./http.js";
import { austrianPostcodeSearch } from "./geocoding.js";
import { forecastParams } from "./forecastSpec.js";
import { settings } from "../app/state.js";
export { CORE, EXTRA, MODELS } from "./forecastSpec.js";
export const Provider = {
  async forecast(l, model) {
    const p = forecastParams(l, model);
    return json("https://api.open-meteo.com/v1/forecast", p);
  },
  async search(q) {
    const local = austrianPostcodeSearch(q);
    if (local !== null) return { results: local };
    return json("https://geocoding-api.open-meteo.com/v1/search", {
      name: q,
      count: 12,
      language: settings.language === "de" ? "de" : "en",
      format: "json",
    });
  },
  async history(l, date) {
    return json("https://archive-api.open-meteo.com/v1/archive", {
      latitude: l.latitude,
      longitude: l.longitude,
      start_date: date,
      end_date: date,
      timezone: "auto",
      timeformat: "unixtime",
      models: "era5",
      hourly:
        "temperature_2m,relative_humidity_2m,precipitation,rain,snowfall,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code",
    });
  },
};
