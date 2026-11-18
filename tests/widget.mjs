import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseConfig, DEFAULT } from '../widget/config.js';
import { fetchForecast, getWeather, widgetRows, todaySummary } from '../widget/weather.js';
import { widgetConfig, widgetAppURL } from '../src/weather/widgetConfig.js';
import { linkedLocation } from '../src/app/deepLink.js';
import { temperature, rainfall, windSpeed } from '../widget/format.js';
import { consensus } from '../src/weather/core.js';
import { normalize } from '../src/weather/normalize.js';
import { forecastCondition } from '../src/weather/conditionLabel.js';
const now = Date.now();
const t = Math.floor(now/3600000)*3600;
const raw = model => ({ hourly: { time: [t,t+3600,t+7200], temperature_2m: [10,11,12], precipitation: model==='best_match'?[1,1,1]:[0,0,0], precipitation_probability:[30,30,30], cloud_cover:[90,90,90],weather_code:[61,61,61]}, current:{time:t,temperature_2m:10,precipitation:0,cloud_cover:90,weather_code:61} });
const request = async p => raw(p.models);
assert.deepEqual(parseConfig(), widgetConfig(DEFAULT));
assert.deepEqual(linkedLocation(new URL(widgetAppURL(DEFAULT)).search), DEFAULT);
for (const q of ['?lat=&lon=0','?lat=0&lon=','?lat=100&lon=0','?lat=0x10&lon=0','?lat=NaN&lon=0','?lat=0&lon=0&tz=invalid']) assert.equal(linkedLocation(q),null);
assert.equal(linkedLocation('?lat=0&lon=0').latitude,0);
const special = {...DEFAULT,name:'St. A & B <Ort>'};
assert.equal(linkedLocation(new URL(widgetAppURL(special)).search).name,special.name);
assert.throws(()=>parseConfig('{"version":9}'));
const units = widgetConfig({...DEFAULT,temperature:'fahrenheit',precipitation:'inch',wind:'ms'});
assert.equal(temperature(0,units),'32°');assert.equal(rainfall(25.4,units),'1,00 in');assert.equal(windSpeed(36,units),'10 m/s');
assert.equal(temperature(null,units),'—');
assert.throws(()=>parseConfig('{"name":"x","latitude":100,"longitude":0}'));
const data = await fetchForecast(DEFAULT,request,now);
assert.deepEqual(data.rows,consensus({rows:normalize(raw('best_match'))},['icon_seamless','ecmwf_ifs025','gfs_seamless'].map(id=>({id,rows:normalize(raw(id))})),now/1000));
assert.equal(forecastCondition(data.rows[0])[0],'☁️');
assert.equal(widgetRows(data,now/1000).hours[0].time,t+3600);
assert.equal(widgetRows(data,(now+3*3600000)/1000).current,undefined);
const cached = await getWeather(DEFAULT,{read:()=>data,request:()=>{throw Error('should not fetch')}},now);
assert.equal(cached.cached,true);
let forcedCalls=0;
await getWeather(DEFAULT,{read:()=>data,request:async p=>{forcedCalls++;return request(p)},write:()=>{}},now,true);
assert.equal(forcedCalls,4);
assert.ok(Number.isFinite(todaySummary(data,DEFAULT.timezone,now).high));
const dstStart=Date.parse('2026-03-28T23:00:00Z');
const dstRows=Array.from({length:23},(_,i)=>({time:dstStart/1000+i*3600,temperature_2m:i,precipitation:1,uv_index:2}));
assert.deepEqual(todaySummary({rows:dstRows},'Europe/Vienna',dstStart+3600000),{high:22,low:0,uv:2,amount:23});
assert.equal(todaySummary(data,DEFAULT.timezone,now+7*86400000).high,null);
const offline = await getWeather(DEFAULT,{read:()=>data,request:()=>{throw Error('offline')}},now+3600000);
assert.equal(offline.offline,true);
const corrupt = await getWeather(DEFAULT,{read:()=>({schema:1,location:DEFAULT,rows:[]}),request,write:()=>{}},now);
assert.equal(corrupt.rows.length,3);
const quota = await getWeather(DEFAULT,{read:()=>null,request,write:()=>{throw Error('quota')}},now);
assert.equal(quota.storageError,true);
const partial = await fetchForecast(DEFAULT, async p=>{if(p.models==='best_match')throw Error();return request(p)},now);
assert.equal(partial.current,null);assert.equal(partial.failures.length,1);
await assert.rejects(()=>getWeather(DEFAULT,{read:()=>null,request:()=>{throw Error()}},now));
// Execute the actual generated script with Scriptable host fakes and no browser globals.
const code = fs.readFileSync('dist/wettra-widget.js','utf8');
assert.ok(code.length < 100000);
for (const family of ['small','medium','large','extraLarge']) for (const fail of [false,true]) {
 const texts=[]; let rendered=false, complete=false;
 class Stack { addText(v){const node={text:String(v),font:null};texts.push(node);return node} addStack(){return new Stack()} addSpacer(){} layoutVertically(){} centerAlignContent(){} }
 class Widget extends Stack {setPadding(){} async presentMedium(){}}
 const files=new Map();
 const fm={joinPath:(a,b)=>a+'/'+b,libraryDirectory:()=>'/local',fileExists:p=>files.has(p),createDirectory(){},writeString:(p,v)=>files.set(p,v),readString:p=>files.get(p),remove:p=>files.delete(p),move:(a,b)=>{files.set(b,files.get(a));files.delete(a)}};
 const context={console, Intl, Date, ListWidget:Widget, Font:{systemFont:size=>({size})},Color:class{},
   args:{widgetParameter:JSON.stringify(units)},config:{runsInWidget:true,widgetFamily:family},FileManager:{local:()=>fm},
   Request:class{constructor(url){this.url=url;this.response={statusCode:200}}async loadJSON(){if(fail)throw Error();return raw(new URL(this.url).searchParams.get('models'))}},
   Script:{setWidget(w){rendered=true;assert.equal(new URL(w.url).searchParams.get('name'),'Graz');assert.ok(w.refreshAfterDate.getTime()>=Date.now()+29*60000)},complete(){complete=true}}};
 await vm.runInNewContext('(async()=>{'+code+'})()',context);
 assert.ok(rendered && complete);assert.ok(texts.some(t=>t.text.includes(fail?'Wetter nicht verfügbar':'Graz')));
 if (family==='medium' && !fail) {
   assert.ok(texts.some(t=>t.text==='Bedeckt · 30 % Regen'), 'medium header combines sky and rain chance');
   assert.ok(texts.some(t=>t.text.includes('Open-Meteo · Widget 0.2.0')), 'medium footer combines date/time and provider');
   assert.ok(texts.some(t=>t.font?.size===20), 'medium hourly weather symbols use the larger font');
   assert.ok(texts.some(t=>t.font?.size===13), 'medium hourly temperatures have their own readable row');
 }
}
console.log('PASS widget: shared consensus/icons, parameters, cache, partial/offline failures, expiry, quota and bundled Scriptable host smoke');
