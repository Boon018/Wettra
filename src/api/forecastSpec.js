export const CORE = [
  "temperature_2m",
  "precipitation",
  "wind_speed_10m",
  "wind_gusts_10m",
  "pressure_msl",
  "cloud_cover",
];
export const EXTRA = [
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation_probability",
  "rain",
  "snowfall",
  "weather_code",
  "wind_direction_10m",
  "visibility",
  "uv_index",
  "is_day",
];
export const MODELS = [
  {
    id: "icon_seamless",
    name: "DWD ICON",
    detail: "D2 → EU → Global · up to 7.5 days",
    horizon: 180,
  },
  {
    id: "ecmwf_ifs025",
    name: "ECMWF IFS 0.25°",
    detail: "Global · up to 15 days",
    horizon: 360,
  },
  {
    id: "gfs_seamless",
    name: "NOAA GFS",
    detail: "Global · up to 16 days",
    horizon: 384,
  },
];
export function forecastParams(l, model, days = 16) {
    const p = {
      latitude: l.latitude,
      longitude: l.longitude,
      timezone: "auto",
      timeformat: "unixtime",
      forecast_days: days,
      models: model,
      hourly: (model === "best_match" ? [...CORE, ...EXTRA] : CORE).join(","),
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
        "is_day",
      ].join(",");
      p.daily = "sunrise,sunset,uv_index_max,weather_code";
    }
    return p;
}
