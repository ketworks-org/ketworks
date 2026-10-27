// Pure table logic for Ketboard: filtering, sorting, and per-instance summaries.
// No DOM access, so the same code runs in the browser and in the node test suite.
const number = value => (value === null || value === undefined || value === '' ? null : Number(value));

export function filterRows(rows, {benchmarkId, methodClass = '', query = ''} = {}) {
  const q = query.trim().toLowerCase();
  return rows.filter(row => {
    if (benchmarkId && row.benchmark_id !== benchmarkId) return false;
    if (methodClass && row.method_class !== methodClass) return false;
    if (!q) return true;
    return `${row.method} ${row.variant} ${row.method_class} ${row.paper.authors} ${row.paper.title} ${row.paper.id}`.toLowerCase().includes(q);
  });
}

// Each key maps a row to a sortable value; null sorts last in either direction.
export const SORT_KEYS = {
  energy: row => number(row.energy_per_site),
  uncertainty: row => number(row.uncertainty_per_site),
  variance: row => number(row.variance_per_site),
  parameters: row => number(row.parameter_count),
  date: row => row.paper.published || null,
  method: row => `${row.method} ${row.variant}`.toLowerCase(),
  method_class: row => row.method_class,
};

export function sortRows(rows, key = 'energy', direction = 'asc') {
  const value = SORT_KEYS[key] || SORT_KEYS.energy;
  const sign = direction === 'desc' ? -1 : 1;
  return rows.map((row, index) => ({row, index, v: value(row)})).sort((a, b) => {
    if (a.v === null && b.v === null) return a.index - b.index;
    if (a.v === null) return 1;
    if (b.v === null) return -1;
    const order = typeof a.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v));
    return (order || a.index - b.index) * (order ? sign : 1);
  }).map(x => x.row);
}

// Instances of a model in a meaningful order: by size (sites, or particles of a continuum system), then by the
// particle number a lattice label states (filling), then by the parameters as the label writes them, numbers
// compared as numbers (U/t = 2.15443 before 4 before 10, −8 before 2), then by key. The Γ point comes before other twists.
function labelChunks(label) {
  const chunks = []; let last = 0;
  for (const m of label.matchAll(/([−-]?)(\d+(?:\.\d+)?)/g)) {
    const signed = m[1] === '−' || (m[1] === '-' && /(^|[\s=(])$/.test(label.slice(0, m.index)));
    const start = signed ? m.index : m.index + m[1].length;
    if (start > last) chunks.push(label.slice(last, start).replaceAll('Γ', '\u0001'));
    chunks.push((signed ? -1 : 1) * Number(m[2])); last = m.index + m[0].length;
  }
  if (last < label.length) chunks.push(label.slice(last).replaceAll('Γ', '\u0001'));
  return chunks;
}
export function naturalCompare(a, b) {
  const x = labelChunks(a), y = labelChunks(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (typeof x[i] !== typeof y[i]) return typeof x[i] === 'number' ? -1 : 1;
    if (x[i] !== y[i]) return typeof x[i] === 'number' ? x[i] - y[i] : x[i] < y[i] ? -1 : 1;
  }
  return x.length - y.length;
}
const particles = label => {
  const m = /N↑ = N↓ = (\d+)|N↑ = (\d+), N↓ = (\d+)|\bN(?:_e|_f)? = (\d+)/.exec(label);
  return !m ? 0 : m[1] ? 2 * Number(m[1]) : m[2] ? Number(m[2]) + Number(m[3]) : Number(m[4]);
};
export function compareInstances(a, b) {
  const la = a.instance_label || a.id, lb = b.instance_label || b.id;
  return a.sites - b.sites || particles(la) - particles(lb) || naturalCompare(la, lb) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
// The registry reordered within each part of each model; models and parts keep the order in which they first appear.
export function orderInstances(benchmarks) {
  const group = b => `${b.family}\u0000${b.part}`, first = new Map();
  benchmarks.forEach((b, i) => { if (!first.has(group(b))) first.set(group(b), i); });
  return [...benchmarks].sort((a, b) => first.get(group(a)) - first.get(group(b)) || compareInstances(a, b));
}

// Sort one instance table by its displayed columns. Missing energies stay last in either
// direction, and ties keep the default size/filling/parameter order.
export function sortInstanceSummaries(summaries, key = 'sites', direction = 'asc') {
  const value = {
    instance: s => s.benchmark.instance_label || s.benchmark.id,
    sites: s => s.benchmark.sites,
    results: s => s.count,
    energy: s => number(s.best?.energy_per_site),
  }[key] || (s => s.benchmark.sites);
  const sign = direction === 'desc' ? -1 : 1;
  return [...summaries].sort((a, b) => {
    const x = value(a), y = value(b), tie = () => compareInstances(a.benchmark, b.benchmark);
    if (x === null && y === null) return tie();
    if (x === null) return 1;
    if (y === null) return -1;
    const order = typeof x === 'number' ? x - y : naturalCompare(x, y);
    return order * sign || tie();
  });
}

// Rank by energy regardless of the displayed order, so the rank column stays meaningful.
export function rankByEnergy(rows) {
  const ranks = new Map();
  sortRows(rows, 'energy', 'asc').forEach((row, i) => ranks.set(row, i + 1));
  return ranks;
}

export function summarize(benchmarks, results) {
  return benchmarks.map(benchmark => {
    const rows = sortRows(results.filter(r => r.benchmark_id === benchmark.id), 'energy', 'asc');
    return {benchmark, count: rows.length, best: rows[0] || null, classes: [...new Set(rows.map(r => r.method_class))]};
  });
}

// An energy with its error bar in the usual compact form, -0.4976921(4), when the error bar is a
// whole number of units of the last printed digit; otherwise "energy ± error". Without an error
// bar the energy is returned alone and `missing` is set.
export function withErrorBar(energy, uncertainty, type = null) {
  if (energy === null || energy === undefined) return {text: '—', missing: false};
  if (uncertainty === null || uncertainty === undefined || uncertainty === '') return {text: energy, missing: true};
  if (type === 'upper_bound') return {text: `${energy} ± <${uncertainty}`, missing: false};
  const places = energy.includes('.') ? energy.split('.')[1].replace(/[eE].*$/, '').length : 0;
  const scaled = Number(uncertainty) * 10 ** places, digits = Math.round(scaled);
  if (!/[eE]/.test(energy) && digits > 0 && Math.abs(scaled - digits) < 1e-6 * Math.max(1, scaled)) return {text: `${energy}(${digits})`, missing: false};
  return {text: `${energy} ± ${uncertainty}`, missing: false};
}

// Boundary class of an instance, used to group instances on a model page. The instance's own
// boundary text stays the definition; this only decides the section it is listed in.
export const BOUNDARY_CLASSES = ['Periodic', 'Periodic × antiperiodic', 'Cylinder', 'Open'];
export function boundaryClass(benchmark) {
  const text = (benchmark.boundary_conditions || '').toLowerCase();
  if (text.includes('antiperiodic')) return 'Periodic × antiperiodic';
  if (text.includes('open') && text.includes('periodic')) return 'Cylinder';
  if (text.includes('open')) return 'Open';
  return 'Periodic';
}
