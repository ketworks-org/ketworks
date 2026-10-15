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
