// The entries of one Ketboard instance as a chart: over time (the date of each paper's first arXiv version), with
// the lowest energy reported so far, or ranked from the lowest. Every point is drawn with its error bar. Only
// Ketboard entries are drawn; energies of other methods (exact, DMRG, QMC) stay on the Ketbook pages.
const SVG = 'http://www.w3.org/2000/svg';
const MINUS = '−';

export function chartPoints(rows) {
  return rows.filter(row => row.energy_per_site !== null && row.energy_per_site !== undefined)
    .map(row => ({row, energy: Number(row.energy_per_site), error: Number(row.uncertainty_per_site ?? 0) || 0, date: Date.parse(row.paper?.published)}))
    .filter(p => Number.isFinite(p.energy) && Number.isFinite(p.date));
}

// The lowest energy reported up to each date: one step per entry that lowered it.
export function lowestSoFar(points) {
  const steps = [];
  [...points].sort((a, b) => a.date - b.date || a.energy - b.energy).forEach(p => { if (!steps.length || p.energy < steps[steps.length - 1].energy) steps.push(p); });
  return steps;
}

// Entries within twice the combined error bar of the lowest energy: not distinguishable from it.
export function tiedWithLowest(points) {
  if (!points.length) return new Set();
  const lowest = points.reduce((a, b) => b.energy < a.energy || (b.energy === a.energy && b.error < a.error) ? b : a);
  return new Set(points.filter(p => p.energy - lowest.energy <= 2 * Math.hypot(p.error, lowest.error)));
}

// The plotted range of energies: from the lowest to a little above most entries, so that one poor baseline does not
// flatten the others. With five or more entries, those above twice the spread of the lower three quarters are left out
// of the range when they would compress it more than threefold; the chart marks them at its edge.
export function focusRange(points) {
  const lo = Math.min(...points.map(p => p.energy - p.error)), all = Math.max(...points.map(p => p.energy + p.error));
  const energies = points.map(p => p.energy).sort((a, b) => a - b);
  if (energies.length < 5) return {lo, hi: all, outside: []};
  const quartile = energies[Math.floor(0.75 * (energies.length - 1))], cut = quartile + Math.max(quartile - energies[0], 1e-12);
  const inside = points.filter(p => p.energy <= cut);
  const hi = Math.max(...inside.map(p => p.energy + p.error));
  if (all - lo <= 3 * (hi - lo)) return {lo, hi: all, outside: []};
  return {lo, hi, outside: points.filter(p => p.energy > cut)};
}

// Round ticks for a linear axis, and the number of decimals that labels them.
export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) { const pad = Math.abs(lo) * 1e-3 || 1e-3; lo -= pad; hi += pad; }
  const raw = (hi - lo) / count, power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * power).find(s => s >= raw * (1 - 1e-9));
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9) + (Math.abs(step / power - 2.5) < 1e-9 ? 1 : 0));
  const ticks = [];
  for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + step * 1e-9; k++) ticks.push(Number((k * step).toFixed(decimals)));
  return {ticks, decimals};
}

// Date ticks: years for a long span, half years or quarters for a short one.
export function timeTicks(lo, hi) {
  const first = new Date(lo).getUTCFullYear(), last = new Date(hi).getUTCFullYear(), ticks = [];
  if (last - first >= 2) {
    const every = last - first > 8 ? 2 : 1;
    for (let year = first + 1; year <= last; year++) if (year % every === 0 && Date.UTC(year, 0, 1) <= hi) ticks.push({time: Date.UTC(year, 0, 1), label: String(year)});
    return ticks;
  }
  const months = last - first >= 1 ? 6 : 3;
  const start = new Date(lo);
  for (let d = Date.UTC(start.getUTCFullYear(), Math.ceil((start.getUTCMonth() + 1) / months) * months, 1); d <= hi; d = Date.UTC(new Date(d).getUTCFullYear(), new Date(d).getUTCMonth() + months, 1))
    ticks.push({time: d, label: new Date(d).toLocaleString('en', {month: 'short', year: 'numeric', timeZone: 'UTC'})});
  return ticks;
}

const formatNumber = (value, decimals) => value.toFixed(decimals).replace('-', MINUS);
const node = (tag, attributes = {}, parent = null) => {
  const el = document.createElementNS(SVG, tag);
  Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
  if (parent) parent.append(el);
  return el;
};
const html = (tag, className, value = '') => { const el = document.createElement(tag); if (className) el.className = className; el.textContent = value; return el; };

let VIEW = (() => { try { return localStorage.getItem('ketboard-chart') || 'rank'; } catch { return 'rank'; } })();
let LAST = null;
if (typeof window !== 'undefined') {
  let timer = null;
  window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { if (LAST && LAST.container.isConnected && !LAST.container.hidden) renderEnergyChart(...LAST.args); }, 150); });
}

// options: label (axis title, with unit and normalization), energyText(row) (the energy as the table prints it),
// describe(row) (method, variant, class and paper for the tooltip).
export function renderEnergyChart(container, rows, options) {
  LAST = {container, args: [container, rows, options]};
  const points = chartPoints(rows);
  container.replaceChildren(); container.hidden = points.length < 2;
  if (container.hidden) return;
  const head = html('div', 'chart-head'), toggle = html('div', 'chart-switch');
  toggle.setAttribute('role', 'group'); toggle.setAttribute('aria-label', 'Chart view');
  [['rank', 'Ranked'], ['time', 'Over time']].forEach(([key, name]) => {
    const button = html('button', '', name); button.type = 'button'; button.setAttribute('aria-pressed', String(VIEW === key));
    button.addEventListener('click', () => { VIEW = key; try { localStorage.setItem('ketboard-chart', key); } catch { /* storage unavailable */ } renderEnergyChart(container, rows, options); });
    toggle.append(button);
  });
  const lowest = points.reduce((a, b) => b.energy < a.energy || (b.energy === a.energy && b.error < a.error) ? b : a);
  const title = html('div', 'chart-title-block'), summary = html('p', 'chart-lowest');
  summary.append(html('span', '', 'Lowest '), html('strong', '', options.energyText(lowest.row)), html('span', '', ` · ${lowest.row.method}, ${lowest.row.paper.published.slice(0, 4)}`));
  title.append(html('p', 'chart-title', options.label), summary);
  head.append(title, toggle);
  const body = html('div', 'chart-body'), tip = html('div', 'chart-tip'); tip.hidden = true; tip.setAttribute('aria-hidden', 'true');
  container.append(head, body, tip);
  const show = (point, target) => {
    tip.replaceChildren(html('strong', '', options.energyText(point.row)), ...options.describe(point.row).map(line => html('span', '', line)));
    tip.hidden = false;
    const box = container.getBoundingClientRect(), mark = target.getBoundingClientRect();
    const left = Math.min(Math.max(mark.left - box.left + mark.width / 2 - tip.offsetWidth / 2, 0), box.width - tip.offsetWidth);
    const above = mark.top - box.top - tip.offsetHeight - 8;
    tip.style.left = `${left}px`; tip.style.top = `${above >= 0 ? above : mark.bottom - box.top + 8}px`;
  };
  const hide = () => { tip.hidden = true; };
  const interactive = (el, point) => {
    el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', `${options.energyText(point.row)}, ${options.describe(point.row).join(', ')}`);
    el.addEventListener('pointerenter', () => show(point, el)); el.addEventListener('focus', () => show(point, el));
    el.addEventListener('pointerleave', hide); el.addEventListener('blur', hide);
  };
  if (VIEW === 'rank') rankChart(body, points, interactive); else timeChart(body, points, interactive);
}

function timeChart(body, points, interactive) {
  const width = Math.max(300, body.clientWidth || 720), height = width < 560 ? 250 : 300, m = {left: 70, right: 16, top: 12, bottom: 30};
  const dates = points.map(p => p.date), lo = Math.min(...dates), hi = Math.max(...dates), padTime = Math.max((hi - lo) * 0.04, 90 * 864e5);
  const x0 = lo - padTime, x1 = hi + padTime;
  const {lo: ylo, hi: yhi, outside} = focusRange(points), above = new Set(outside);
  const {ticks, decimals} = niceTicks(ylo, yhi, height < 280 ? 4 : 5);
  const ypad = (yhi - ylo) * 0.06 || Math.abs(ylo) * 1e-4 || 1e-4, y0 = ylo - ypad, y1 = yhi + ypad;
  const x = t => m.left + (t - x0) / (x1 - x0) * (width - m.left - m.right);
  const y = e => m.top + (y1 - e) / ((y1 - y0) || 1) * (height - m.top - m.bottom);
  const svg = node('svg', {width, height, viewBox: `0 0 ${width} ${height}`, class: 'chart-plot', role: 'group'}, body);
  const steps = lowestSoFar(points), best = steps[steps.length - 1];
  svg.setAttribute('aria-label', `${points.length} energies from ${new Date(lo).getUTCFullYear()} to ${new Date(hi).getUTCFullYear()}; the lowest is ${formatNumber(best.energy, Math.max(decimals, 4))}.`);
  const grid = node('g', {class: 'chart-grid'}, svg);
  ticks.filter(t => t >= y0 - 1e-12 && t <= y1 + 1e-12).forEach(t => { node('line', {x1: m.left, x2: width - m.right, y1: y(t), y2: y(t)}, grid); node('text', {x: m.left - 8, y: y(t) + 4, 'text-anchor': 'end'}, grid).textContent = formatNumber(t, decimals); });
  timeTicks(x0, x1).forEach(t => { node('line', {x1: x(t.time), x2: x(t.time), y1: height - m.bottom, y2: height - m.bottom + 5, class: 'chart-tick'}, grid); node('text', {x: x(t.time), y: height - 8, 'text-anchor': 'middle'}, grid).textContent = t.label; });
  node('line', {x1: m.left, x2: width - m.right, y1: height - m.bottom, y2: height - m.bottom, class: 'chart-axis'}, svg);
  // Variants of one paper share a date: spread them a few pixels apart so each error bar stays visible.
  const offset = new Map(), groups = new Map();
  points.forEach(p => { const key = `${p.row.paper.id}`; groups.set(key, [...(groups.get(key) || []), p]); });
  groups.forEach(list => list.sort((a, b) => a.energy - b.energy).forEach((p, i) => offset.set(p, Math.max(-12, Math.min(12, (i - (list.length - 1) / 2) * 5)))));
  const px = p => x(p.date) + offset.get(p);
  let d = `M${px(steps[0])},${y(steps[0].energy)}`;
  steps.slice(1).forEach(p => { d += `H${px(p)}V${y(p.energy)}`; });
  node('path', {d: d + `H${width - m.right}`, class: 'chart-best'}, svg);
  const top = m.top, bottom = height - m.bottom, clamp = v => Math.max(top, Math.min(bottom, v));
  const marks = node('g', {class: 'chart-points'}, svg);
  [...points].sort((a, b) => b.energy - a.energy).forEach(p => {
    const g = node('g', {class: 'chart-point'}, marks), cx = px(p), cy = above.has(p) ? top + 4 : y(p.energy);
    if (above.has(p)) node('path', {d: `M${cx - 5},${cy + 4}L${cx},${cy - 4}L${cx + 5},${cy + 4}Z`, class: 'chart-dot'}, g);
    else { errorBar(g, cx, clamp(y(p.energy + p.error)), clamp(y(p.energy - p.error)), true); node('circle', {cx, cy, r: 4.5, class: 'chart-dot'}, g); }
    node('circle', {cx, cy, r: 13, class: 'chart-hit'}, g);
    interactive(g, p);
  });
  const legend = html('div', 'chart-legend');
  legend.append(key('dot', 'Entry, with its error bar'), key('line', 'Lowest energy reported so far'));
  if (outside.length) legend.append(key('up', `${outside.length} ${outside.length === 1 ? 'entry' : 'entries'} above the plotted range`));
  legend.append(html('span', 'chart-note', 'Date of the paper’s first arXiv version'));
  body.append(legend);
}

function rankChart(body, points, interactive) {
  const sorted = [...points].sort((a, b) => a.energy - b.energy || a.error - b.error), tied = tiedWithLowest(points);
  const width = Math.max(300, body.clientWidth || 720), labelWidth = Math.min(Math.round(width * 0.42), 330), stripWidth = width - labelWidth - 38;
  const {lo, hi, outside} = focusRange(points), beyond = new Set(outside);
  const {ticks, decimals} = niceTicks(lo, hi, stripWidth < 300 ? 3 : 5);
  const x0 = Math.min(lo, ticks[0]), x1 = Math.max(hi, ticks[ticks.length - 1]), pad = 10;
  const x = e => pad + (e - x0) / ((x1 - x0) || 1) * (stripWidth - 2 * pad);
  const list = html('ol', 'rank-list'); list.style.setProperty('--label-width', `${labelWidth}px`);
  const limit = 20, rows = sorted.map((p, i) => {
    const li = html('li', tied.has(p) ? 'rank-row tied' : 'rank-row');
    const label = html('span', 'rank-label', p.row.method); label.append(html('small', '', `${p.row.variant} · ${p.row.paper.published.slice(0, 4)}`));
    const svg = node('svg', {width: stripWidth, height: 26, viewBox: `0 0 ${stripWidth} 26`, class: 'rank-strip', 'aria-hidden': 'true'});
    ticks.forEach(t => node('line', {x1: x(t), x2: x(t), y1: 0, y2: 26, class: 'rank-grid'}, svg));
    const clamp = v => Math.max(1, Math.min(stripWidth - 1, v));
    if (beyond.has(p)) node('path', {d: `M${stripWidth - 9},8L${stripWidth - 1},13L${stripWidth - 9},18Z`, class: 'chart-dot'}, svg);
    else { errorBar(svg, 13, clamp(x(p.energy - p.error)), clamp(x(p.energy + p.error)), false); node('circle', {cx: x(p.energy), cy: 13, r: 4.5, class: 'chart-dot'}, svg); }
    li.append(html('span', 'rank-number mono', String(i + 1)), label, svg);
    interactive(li, p);
    if (i >= limit) li.hidden = true;
    list.append(li); return li;
  });
  const axis = node('svg', {width: stripWidth, height: 24, viewBox: `0 0 ${stripWidth} 24`, class: 'rank-axis'});
  node('line', {x1: 0, x2: stripWidth, y1: 1, y2: 1, class: 'chart-axis'}, axis);
  ticks.forEach(t => node('text', {x: x(t), y: 17, 'text-anchor': 'middle'}, axis).textContent = formatNumber(t, decimals));
  const axisRow = html('div', 'rank-axis-row'); axisRow.style.setProperty('--label-width', `${labelWidth}px`); axisRow.append(axis);
  body.append(list, axisRow);
  if (sorted.length > limit) {
    const more = html('button', 'text-link chart-more', `Show all ${sorted.length} entries`); more.type = 'button';
    more.addEventListener('click', () => { rows.forEach(li => { li.hidden = false; }); more.remove(); });
    body.append(more);
  }
  const legend = html('div', 'chart-legend');
  legend.append(key('dot', 'Within twice the combined error bar of the lowest energy'), key('ring', 'Distinguishable from it'));
  if (outside.length) legend.append(key('right', `${outside.length} ${outside.length === 1 ? 'entry' : 'entries'} beyond the plotted range`));
  legend.append(html('span', 'chart-note', 'Lowest energy first'));
  body.append(legend);
}

// An error bar with caps, vertical (time chart: x fixed) or horizontal (ranked strips: y fixed).
function errorBar(parent, at, from, to, vertical) {
  if (Math.abs(to - from) < 0.01) return;
  const g = node('g', {class: 'chart-error'}, parent);
  const segment = (a, b, c, e) => node('line', vertical ? {x1: a, x2: b, y1: c, y2: e} : {x1: c, x2: e, y1: a, y2: b}, g);
  segment(at, at, from, to); segment(at - 3.5, at + 3.5, from, from); segment(at - 3.5, at + 3.5, to, to);
}

function key(kind, label) {
  const item = html('span', 'chart-key'), svg = node('svg', {width: 22, height: 12, viewBox: '0 0 22 12', 'aria-hidden': 'true'});
  if (kind === 'line') node('path', {d: 'M1,4H11V9H21', class: 'chart-best'}, svg);
  else if (kind === 'up') node('path', {d: 'M6,10L11,2L16,10Z', class: 'chart-dot'}, svg);
  else if (kind === 'right') node('path', {d: 'M7,2L15,6L7,10Z', class: 'chart-dot'}, svg);
  else { node('line', {x1: 11, x2: 11, y1: 1, y2: 11, class: 'chart-error-key'}, svg); node('circle', {cx: 11, cy: 6, r: 4, class: kind === 'ring' ? 'chart-dot ring' : 'chart-dot'}, svg); }
  item.append(svg, document.createTextNode(label));
  return item;
}
