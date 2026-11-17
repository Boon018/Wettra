import { widgetConfig, WIDGET_VERSION, WIDGET_DEFAULT } from '../src/weather/widgetConfig.js';
export const VERSION = WIDGET_VERSION;
export const DEFAULT = WIDGET_DEFAULT;
export const parseConfig = value => widgetConfig(value || DEFAULT);
export const cacheKey = l => `${l.latitude.toFixed(5)}_${l.longitude.toFixed(5)}`;
