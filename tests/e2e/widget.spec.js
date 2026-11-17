import { test, expect } from '@playwright/test';
import { providers } from './fixtures.js';
test.beforeEach(async ({page}) => providers(page));
test('widget location opens without changing saved startup settings', async ({page}) => {
  await page.goto('./');
  await expect(page.locator('.temperature')).toBeVisible();
  await page.evaluate(()=>{
    const graz = window.Alpen.state.location;
    localStorage.setItem('alpen.v1.location',JSON.stringify(graz));
    localStorage.setItem('alpen.v1.settings',JSON.stringify({...window.Alpen.settings,defaultLocation:graz}));
  });
  const before=await page.evaluate(()=>[localStorage.getItem('alpen.v1.location'),localStorage.getItem('alpen.v1.settings')]);
  await page.goto('./?lat=48.2082&lon=16.3738&name=Vienna&tz=Europe%2FVienna');
  await expect(page.locator('#locationTitle')).toHaveText('Vienna');
  expect(await page.evaluate(()=>[localStorage.getItem('alpen.v1.location'),localStorage.getItem('alpen.v1.settings')])).toEqual(before);
  expect(new URL(page.url()).searchParams.has('lat')).toBe(false);
  await page.locator('[data-view="settings"]').click();
  const config=JSON.parse(await page.locator('#widgetConfig').inputValue());
  expect(config.name).toBe('Vienna');expect(config.latitude).toBe(48.2082);expect(config.version).toBe(1);
  await page.reload();await expect(page.locator('#locationTitle')).toHaveText('Graz');
});
test('widget export units, clipboard fallback and narrow settings layout',async({page})=>{
  await page.setViewportSize({width:320,height:800});
  await page.goto('./');await expect(page.locator('.temperature')).toBeVisible();
  await page.locator('[data-view="settings"]').click();
  await page.locator('#temperature').selectOption('fahrenheit');
  await page.locator('#wind').selectOption('mph');
  await page.locator('#precipitation').selectOption('inch');
  const config=JSON.parse(await page.locator('#widgetConfig').inputValue());
  expect(config.temperature).toBe('fahrenheit');expect(config.wind).toBe('mph');expect(config.precipitation).toBe('inch');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}}));
  await page.locator('[data-action="copyWidget"]').click();
  await expect(page.locator('#widgetCopyStatus')).toContainText('Copy the selected text');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('invalid widget coordinates ignored, labels are escaped',async({page})=>{
  await page.goto('./?lat=NaN&lon=0');await expect(page.locator('#locationTitle')).toHaveText('Graz');
  await page.goto('./?lat=0&lon=0&name='+encodeURIComponent('<img src=x onerror=alert(1)>'));
  await expect(page.locator('#locationTitle')).toHaveText('<img src=x onerror=alert(1)>');
  await page.locator('[data-view="settings"]').click();
  expect(JSON.parse(await page.locator('#widgetConfig').inputValue()).latitude).toBe(0);
  expect(await page.locator('img[src="x"]').count()).toBe(0);
});
test('installer copies the bundled script without executing it',async({page})=>{
  await page.goto('./widget.html');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.copiedWidget=t}}}));
  await page.locator('#copy').click();await expect(page.locator('#status')).toContainText('Kopiert');
  expect(await page.evaluate(()=>window.copiedWidget.startsWith('// Wettra Widget 0.2.0'))).toBe(true);
});
