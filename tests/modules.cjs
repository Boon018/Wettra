'use strict';
const assert = require('node:assert/strict');

(async () => {
  const projection = await import('../src/radar/projection.js');
  const graz = projection.worldPoint(47.0707, 15.4395, 7);
  const tile = projection.tilePoint(47.0707, 15.4395, 7);
  assert(Number.isFinite(graz.x) && Number.isFinite(graz.y));
  assert.deepEqual(tile, { x: Math.floor(graz.x / 256), y: Math.floor(graz.y / 256) });
  assert.equal(projection.wrapTileX(-1, 7), 127);
  assert.equal(projection.validTileY(-1, 7), false);
  assert.equal(projection.validTileY(127, 7), true);
  const keys = await import('../src/storage/keys.js');
  assert.equal(keys.locationKey({ latitude: 47.0707, longitude: 15.4395 }), '47.071,15.440');
  assert.equal(keys.storageKey('forecast', '47.071,15.440'), 'alpen.v1.forecast:47.071,15.440');
  const localization = await import('../src/ui/i18n.js');
  const state = await import('../src/app/state.js');
  assert.equal(localization.t('Find'), 'Suchen');
  assert.equal(localization.t('Search'), 'Suchen');
  assert.equal(localization.t('Finding locations'), 'Finding locations');
  assert.equal(localization.t('RainViewer'), 'RainViewer');
  state.settings.language = 'en';
  assert.equal(localization.t('Suchen'), 'Search');
  assert.equal(localization.t('findenen'), 'findenen');
  console.log('PASS: modular radar projection, storage keys and word-boundary localization.');
})().catch(error => { console.error(error); process.exitCode = 1; });
