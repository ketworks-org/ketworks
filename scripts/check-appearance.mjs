import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../site/appearance.js', import.meta.url), 'utf8');
function openPage(saved, blocked = false) {
  const dataset = {}, events = {};
  runInNewContext(source, {
    document: {documentElement: {dataset}, addEventListener() {}, getElementById() { return null; }},
    window: {addEventListener(type, handler) { events[type] = handler; }},
    localStorage: {getItem() { if (blocked) throw new Error('Storage blocked'); return saved; }},
  });
  return {dataset, storage: events.storage};
}
const defaults = {palette: 'cool', plot: 'charcoal'};
// Restoration runs before DOMContentLoaded, including on static article pages.
assert.deepEqual(openPage(null).dataset, defaults);
assert.deepEqual(openPage('{"palette":"warm","plot":"blue"}').dataset, {palette: 'warm', plot: 'blue'});
// Stale, damaged or inaccessible preferences must not prevent the page from loading.
for (const saved of ['{', 'null', '42', '[]', '{"palette":"unknown","plot":"unknown"}']) {
  assert.deepEqual(openPage(saved).dataset, defaults);
}
assert.deepEqual(openPage('{"palette":"white","plot":"unknown"}').dataset, {palette: 'white', plot: 'charcoal'});
assert.deepEqual(openPage(null, true).dataset, defaults);
// Open articles update when another tab changes or resets the preference.
const page = openPage(null);
page.storage({key: 'unrelated', newValue: '{"palette":"warm","plot":"blue"}'});
assert.deepEqual(page.dataset, defaults);
page.storage({key: 'ketworks-appearance', newValue: '{"palette":"warm","plot":"blue"}'});
assert.deepEqual(page.dataset, {palette: 'warm', plot: 'blue'});
page.storage({key: 'ketworks-appearance', newValue: null});
assert.deepEqual(page.dataset, defaults);
page.storage({key: null, newValue: null});
assert.deepEqual(page.dataset, defaults);
console.log('Appearance restoration, invalid storage and cross-tab checks pass.');
