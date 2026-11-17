import { build } from 'esbuild';
import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { WIDGET_VERSION } from '../src/weather/widgetConfig.js';
const result = await build({ entryPoints: ['widget/main.js'], bundle: true, write: false,
  format: 'esm', target: 'safari15', legalComments: 'inline', metafile: true });
const forbidden = Object.keys(result.metafile.inputs).filter(p => /src\/(ui|app|storage|data)\//.test(p));
if (forbidden.length) throw Error('Browser dependency in widget: ' + forbidden.join(', '));
const code = '// Wettra Widget ' + WIDGET_VERSION + ' · Weather: Open-Meteo (CC BY 4.0)\n// https://open-meteo.com/ · https://boon018.github.io/Wettra/\n' + result.outputFiles[0].text;
if (/\b(?:import|export)\s/.test(result.outputFiles[0].text)) throw Error('Unbundled module');
await mkdir('dist', {recursive:true});
await rm('dist/alpenwetter-widget.js', { force: true });
await writeFile('dist/wettra-widget.js', code);
await cp('widget/install.html', 'dist/widget.html');
console.log('Built standalone Scriptable widget: ' + Buffer.byteLength(code) + ' bytes');
