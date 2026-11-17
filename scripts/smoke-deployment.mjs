import fs from 'node:fs/promises';
import { WIDGET_VERSION } from '../src/weather/widgetConfig.js';
const expected=JSON.parse(await fs.readFile('dist/version.json','utf8'));
const base=new URL(process.argv[2]||'https://boon018.github.io/Wettra/');
for(let attempt=0;attempt<12;attempt++){
 try{
  const url=new URL('./',base);url.searchParams.set('release',expected.build);
  const response=await fetch(url,{signal:AbortSignal.timeout(15000),cache:'no-store'});
  const html=await response.text();
  if(!response.ok||!html.includes('content="'+expected.build+'"')||!html.includes('<title>Wettra</title>'))throw Error('New build not visible yet');
  const manifest=await fetch(new URL('./manifest.webmanifest',base),{signal:AbortSignal.timeout(15000)});
  if(!manifest.ok)throw Error('Manifest unavailable');
  const widget = await fetch(new URL('./wettra-widget.js?release='+expected.build,base),{signal:AbortSignal.timeout(15000)});
  if(!widget.ok || !(await widget.text()).startsWith('// Wettra Widget '+WIDGET_VERSION+' '))throw Error('Widget build unavailable');
  const installer = await fetch(new URL('./widget.html?release='+expected.build,base),{signal:AbortSignal.timeout(15000)});
  if(!installer.ok || !(await installer.text()).includes('Skript kopieren'))throw Error('Widget installer unavailable');
  console.log(`LIVE: Wettra ${expected.version}, build ${expected.build}, ${base.href}`);process.exit(0);
 }catch(error){if(attempt===11)throw error;await new Promise(resolve=>setTimeout(resolve,10000));}
}
