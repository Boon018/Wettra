import { DEFAULT, parseConfig } from './config.js';
import { getWeather } from './weather.js';
import { storageAndNetwork } from './io.js';
import { renderWidget, errorWidget } from './renderer.js';
async function main() {
  let location = DEFAULT, widget;
  try {
    location = parseConfig(args.widgetParameter);
    const data = await getWeather(location, storageAndNetwork(location), Date.now(), !config.runsInWidget);
    widget = renderWidget(data, location, config.widgetFamily || 'medium');
  } catch (error) {
    widget = errorWidget(location, error.message || 'Bitte später erneut versuchen.');
  }
  Script.setWidget(widget);
  if (!config.runsInWidget) await widget.presentMedium();
  Script.complete();
}
await main();
