import {makeSubmission, METHOD_CLASSES} from './submission.mjs';
import {filterRows, sortRows, rankByEnergy, summarize} from './leaderboard.mjs';
let dataset, submission, sort = {key: 'energy', direction: 'asc'};
const $ = id => document.getElementById(id);
const text = (tag, value, className) => { const el = document.createElement(tag); el.textContent = value; if (className) el.className = className; return el; };
const link = (label, url, className) => { const a = text('a', label, className); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
const classLabel = key => METHOD_CLASSES[key] || key;
const formatCount = n => n.toLocaleString('en-US');

function lattice(triangular = false) {
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 68 66'); svg.setAttribute('aria-hidden', 'true');
  const points = Array.from({length: 9}, (_, i) => [10 + i % 3 * 21 + (triangular && Math.floor(i / 3) % 2 ? 8 : 0), 10 + Math.floor(i / 3) * 21]);
  points.forEach(([x, y], i) => {[i % 3 < 2 ? i + 1 : -1, i < 6 ? i + 3 : -1, triangular && i < 6 && i % 3 < 2 ? i + 4 : -1].filter(j => j >= 0).forEach(j => { const line = document.createElementNS(ns, 'line'); Object.entries({x1: x, y1: y, x2: points[j][0], y2: points[j][1]}).forEach(([k, v]) => line.setAttribute(k, v)); svg.append(line); });});
  points.forEach(([cx, cy]) => { const circle = document.createElementNS(ns, 'circle'); Object.entries({cx, cy, r: 3}).forEach(([k, v]) => circle.setAttribute(k, v)); svg.append(circle); }); return svg;
}

function route() {
  const requested = location.hash.slice(1).split('?')[0] || 'overview';
  const name = ['overview', 'benchmarks', 'wiki', 'contribute', 'submit'].includes(requested) ? requested : (requested === 'learn' ? 'wiki' : 'overview');
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== name);
  document.querySelectorAll('[data-nav]').forEach(el => { if (el.dataset.nav === name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  const selected = new URLSearchParams(location.hash.split('?')[1] || '').get('system');
  if (dataset) {
    const benchmark = dataset.benchmarks.find(b => b.id === selected);
    if (benchmark) $('model-select').value = benchmark.family;
    renderInstances('model-select', 'system-select', benchmark?.id);
    renderResults();
  }
  document.title = name === 'overview' ? 'Ketbook — Neural quantum states' : `${name === 'benchmarks' ? 'Ketboard' : name.charAt(0).toUpperCase() + name.slice(1)} — Ketbook`;
}

// Landing page: the book's contents grouped by section, and a ledger of benchmark instances.
function sections() { return [...new Set(dataset.wiki.map(page => page.section))]; }
function renderContents() {
  $('book-contents').replaceChildren();
  sections().forEach((section, s) => {
    const column = text('div', '', 'contents-column');
    const head = text('p', '', 'contents-section'); head.append(text('span', '', `section-mark m${s % 3}`), text('span', section)); column.append(head);
    dataset.wiki.filter(page => page.section === section).forEach(page => {
      const a = text('a', '', 'contents-entry'); a.href = `wiki/${page.slug}/`;
      a.append(text('span', String(dataset.wiki.indexOf(page) + 1).padStart(2, '0'), 'mono'), text('strong', page.title), text('span', page.summary, 'contents-summary'));
      column.append(a);
    });
    $('book-contents').append(column);
  });
}
function renderLedger() {
  $('ledger').replaceChildren();
  summarize(dataset.benchmarks, dataset.results).forEach(({benchmark, count, best}) => {
    const tr = document.createElement('tr');
    const system = text('td', ''); const name = text('a', '', 'ledger-system'); name.href = '#benchmarks?system=' + encodeURIComponent(benchmark.id); name.append(lattice(benchmark.family.includes('Triangular')), text('span', benchmark.family)); system.append(name);
    const key = text('td', ''); key.append(text('code', benchmark.id, 'key'));
    const energy = text('td', best ? best.energy_per_site : '—', 'num energy'); if (best) energy.append(text('small', `${best.method} · arXiv:${best.paper.id}`));
    tr.append(system, text('td', benchmark.instance_label || benchmark.geometry), key, text('td', count ? formatCount(count) : '0', 'num mono'), energy);
    $('ledger').append(tr);
  });
}

function renderSelects() {
  [...new Set(dataset.benchmarks.map(b => b.family))].forEach(model => { for (const id of ['model-select', 'submit-model']) { const option = text('option', model); option.value = model; $(id).append(option); } });
  Object.entries(METHOD_CLASSES).forEach(([value, label]) => { for (const id of ['class-filter', 'submit-class']) { const option = text('option', label); option.value = value; $(id).append(option); } });
  renderInstances('submit-model', 'submit-system');
}
function renderInstances(modelId, instanceId, selectedId) {
  const select = $(instanceId), previous = selectedId || select.value;
  const instances = dataset.benchmarks.filter(b => b.family === $(modelId).value);
  select.replaceChildren();
  instances.forEach(b => { const option = text('option', b.instance_label || `${b.sites} sites · ${b.geometry} · ${b.hamiltonian} · ${b.sector}`); option.value = b.id; select.append(option); });
  if (instances.some(b => b.id === previous)) select.value = previous;
}

function renderWiki() {
  const query = $('wiki-search').value.toLowerCase(); $('wiki-list').replaceChildren();
  sections().forEach((section, s) => {
    const pages = dataset.wiki.filter(page => page.section === section && `${page.title} ${page.section} ${page.summary}`.toLowerCase().includes(query));
    if (!pages.length) return;
    const group = text('div', '', 'wiki-group'); const head = text('h2', '', 'wiki-group-title'); head.append(text('span', '', `section-mark m${s % 3}`), text('span', section)); group.append(head);
    pages.forEach(page => {
      const a = text('a', '', 'wiki-row'); a.href = `wiki/${page.slug}/`; const content = text('div', ''); content.append(text('h3', page.title), text('p', page.summary));
      a.append(text('span', String(dataset.wiki.indexOf(page) + 1).padStart(2, '0'), 'wiki-number'), content, text('span', '↗'));
      group.append(a);
    });
    $('wiki-list').append(group);
  });
  $('wiki-empty').hidden = $('wiki-list').childElementCount > 0;
}

function currentRows() {
  return sortRows(filterRows(dataset.results, {benchmarkId: $('system-select').value, methodClass: $('class-filter').value, query: $('search').value}), sort.key, sort.direction);
}
function renderResults() {
  const b = dataset.benchmarks.find(b => b.id === $('system-select').value); if (!b) return;
  $('system-name').textContent = b.family; $('instance-label').textContent = b.instance_label || ''; $('system-key').textContent = b.id;
  $('system-wiki').hidden = !b.wiki; if (b.wiki) $('system-wiki').href = `wiki/${b.wiki}/`;
  document.querySelectorAll('[data-instance]').forEach(a => a.classList.toggle('active', a.dataset.instance === b.id));
  $('system-definition').replaceChildren(); const dl = document.createElement('dl');
  const h = text('dd', ''); if (b.hamiltonian_html) h.innerHTML = b.hamiltonian_html; else h.textContent = b.hamiltonian;
  dl.append(text('dt', 'Hamiltonian'), h);
  const parameters = text('dd', ''); if (b.parameters_html) parameters.innerHTML = b.parameters_html; else parameters.textContent = b.sector;
  dl.append(text('dt', 'Parameters'), parameters);
  [['Lattice size', b.lattice_size || `${b.sites} sites`], ['Boundaries', b.boundary_conditions || b.geometry], ['Sector', b.sector], ['Units', `${b.unit} per site`]].forEach(([k, v]) => dl.append(text('dt', k), text('dd', v)));
  const conventions = document.createElement('details'); conventions.className = 'instance-conventions'; conventions.append(text('summary', 'Full geometry and conventions'), text('p', b.geometry), text('p', b.hamiltonian));
  $('system-definition').append(dl, conventions);
  const rows = currentRows(), ranks = rankByEnergy(rows); $('results').replaceChildren();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const method = text('td', row.method); method.append(text('small', row.variant));
    const cls = text('td', ''); cls.append(text('span', classLabel(row.method_class), 'tag'));
    const energy = text('td', row.energy_per_site, 'num energy');
    const uncertainty = text('td', row.uncertainty_per_site === null ? '—' : `± ${row.uncertainty_per_site}`, 'num mono'); uncertainty.append(text('small', row.uncertainty_type.replaceAll('_', ' ')));
    const parameters = text('td', row.parameter_count === null ? '—' : formatCount(row.parameter_count), 'num mono');
    const paper = text('td', ''); paper.append(link(`arXiv:${row.paper.id}`, `https://arxiv.org/abs/${row.paper.id}`, 'mono'), text('small', `${row.paper.published.slice(0, 4) || ''} · ${row.paper.authors}`)); paper.title = row.paper.title;
    const evidence = text('td', ''); evidence.append(link(row.source_location, row.source_url));
    tr.append(text('td', String(ranks.get(row)), 'num mono rank'), method, cls, energy, uncertainty, parameters, paper, evidence); $('results').append(tr);
  });
  document.querySelectorAll('.board th').forEach(th => { const button = th.querySelector('.sort'); if (!button) return; if (button.dataset.sort === sort.key) th.setAttribute('aria-sort', sort.direction === 'asc' ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort'); });
  $('result-count').textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`; $('empty-results').hidden = rows.length > 0;
  const any = dataset.results.some(r => r.benchmark_id === b.id); $('empty-results').querySelector('h3').textContent = any ? 'No results match this filter.' : 'No reviewed results for this instance yet.';
  $('empty-results').querySelector('p').textContent = any ? 'Change the class filter or the search text.' : 'Results appear after their pull request is reviewed and merged.';
}

function download(value, filename) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + '\n'], {type: 'application/json'})); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function prepareSubmission(event) {
  event.preventDefault(); $('submission-error').textContent = ''; if (!dataset) return;
  const values = Object.fromEntries(new FormData(event.target));
  const b = dataset.benchmarks.find(b => b.id === values.benchmark_id);
  try { submission = makeSubmission(values, b); } catch (error) { $('submission-error').textContent = error.message; return; }
  const id = submission.paper.id;
  const filename = `data/results/${id.replace(/v\d+$/, '')}.json`, json = JSON.stringify(submission, null, 2) + '\n';
  $('submission-json').textContent = json;
  const sourceRef = dataset.source_ref.split('/').map(encodeURIComponent).join('/');
  $('github-new-result').href = `https://github.com/gcarleo/ketbook/new/${sourceRef}?` + new URLSearchParams({filename, value: json}).toString();
  $('github-edit-result').href = `https://github.com/gcarleo/ketbook/edit/${sourceRef}/${filename}`;
  $('submission-ready').hidden = false; $('submission-ready').scrollIntoView({behavior: 'smooth', block: 'start'});
}

window.addEventListener('hashchange', () => { route(); document.getElementById('site-nav')?.classList.remove('open'); });
$('model-select').addEventListener('change', () => { if (!dataset) return; renderInstances('model-select', 'system-select'); location.hash = '#benchmarks?system=' + encodeURIComponent($('system-select').value); });
$('system-select').addEventListener('change', () => location.hash = '#benchmarks?system=' + encodeURIComponent($('system-select').value));
$('submit-model').addEventListener('change', () => { if (dataset) renderInstances('submit-model', 'submit-system'); });
['search', 'class-filter'].forEach(id => $(id).addEventListener('input', () => { if (dataset) renderResults(); }));
$('wiki-search').addEventListener('input', () => { if (dataset) renderWiki(); });
document.querySelectorAll('.board .sort').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  sort = key === sort.key ? {key, direction: sort.direction === 'asc' ? 'desc' : 'asc'} : {key, direction: key === 'date' ? 'desc' : 'asc'};
  if (dataset) renderResults();
}));
$('download').addEventListener('click', () => { if (dataset) download({benchmark: dataset.benchmarks.find(b => b.id === $('system-select').value), results: currentRows()}, `${$('system-select').value}.json`); });
$('submission-form').addEventListener('submit', prepareSubmission); $('download-result').addEventListener('click', () => { if (submission) download(submission, submission.paper.id.replace(/v\d+$/, '') + '.json'); });
route(); fetch('data.json').then(r => { if (!r.ok) throw Error('Data unavailable'); return r.json(); }).then(data => { dataset = data; renderSelects(); renderContents(); renderLedger(); renderWiki(); route(); }).catch(() => { $('load-error').hidden = false; });
