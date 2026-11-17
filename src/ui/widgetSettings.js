import { state, settings } from '../app/state.js';
import { widgetConfig } from '../weather/widgetConfig.js';
import { esc } from './format.js';
export function widgetSettings() {
  const config = widgetConfig({ ...state.location, name: state.location.name.slice(0, 100), temperature: settings.temperature, wind: settings.wind, precipitation: settings.precipitation });
  return `<section class="card stack"><h2>iPhone & iPad widget</h2>
    <p>Use Scriptable to show Wettra on your Home Screen. Select a place in Weather first, then copy its configuration here.</p>
    <p><a href="./widget.html" target="_blank" rel="noopener">Installation & update instructions</a> · <a href="./wettra-widget.js" download>Download widget script</a></p>
    <label for="widgetConfig">Widget parameter for ${esc(config.name)}</label>
    <textarea id="widgetConfig" readonly rows="5" style="width:100%;max-width:100%;box-sizing:border-box;font:inherit;color:inherit;background:transparent;padding:12px;border:1px solid currentColor;border-radius:12px">${esc(JSON.stringify(config))}</textarea>
    <button data-action="copyWidget">Copy widget configuration</button><p id="widgetCopyStatus" role="status" aria-live="polite"></p>
    <p class="footnote">Paste into Scriptable’s widget Parameter field. Refresh target: 30 minutes; iOS may update later. The widget has its own local cache. Re-export to change its location or units; no automatic sync. Opening a widget location does not replace your saved default place.</p></section>`;
}
export async function copyWidgetConfig() {
  const field = document.getElementById('widgetConfig');
  const status = document.getElementById('widgetCopyStatus');
  if (!field || !status) return;
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = 'Copied. Paste into the Scriptable widget Parameter field.';
  } catch {
    field.focus(); field.select(); field.setSelectionRange(0, field.value.length);
    status.textContent = 'Copy the selected text, then paste into the Scriptable widget Parameter field.';
  }
}
