const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const TOKEN = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\((\d+)\))?([eE][+-]?\d+)?$/;
// Mirrors METHOD_CLASSES in nqsbot/schema.py; labels are what Ketboard displays.
export const METHOD_CLASSES = {rbm:'Boltzmann machine', feed_forward:'Feed-forward', convolutional:'Convolutional', autoregressive:'Autoregressive', transformer:'Transformer', backflow:'Backflow / determinant', hybrid:'Hybrid', other:'Other'};
// Every new entry needs an error bar, so "not reported" is not offered for submissions.
export const UNCERTAINTY_TYPES = ['standard_error','standard_deviation','confidence_interval','unspecified','upper_bound'];

// Parse a printed energy such as "-0.497634(1)" or "-199.05174" into decimal strings.
// The uncertainty follows from the parenthesized digits and the number of decimal places.
export function parseToken(raw) {
  const token = String(raw || '').trim().replaceAll('−', '-').replace(/\s+/g, '');
  const m = token.match(TOKEN);
  if (!m || !Number.isFinite(Number(m[1] + (m[3] || '')))) throw Error('Enter the energy exactly as printed, for example -0.497634(1) or -199.05174.');
  const energy = m[1] + (m[3] || '');
  let uncertainty = null;
  if (m[2]) {
    const places = m[1].includes('.') ? m[1].split('.')[1].length : 0, exponent = (m[3] ? Number(m[3].slice(1)) : 0) - places;
    const digits = m[2].replace(/^0+/, '') || '0';
    uncertainty = exponent >= 0 ? digits + '0'.repeat(exponent) : (digits.length > -exponent ? digits.slice(0, digits.length + exponent) + '.' + digits.slice(digits.length + exponent) : '0.' + '0'.repeat(-exponent - digits.length) + digits);
  }
  return {token, energy, uncertainty};
}

export function makeSubmission(values, benchmark) {
  const v = name => String(values[name] || '').trim();
  if (!/^\d{4}\.\d{4,5}v[1-9]\d*$/.test(v('paper_id'))) throw Error('Use an exact arXiv version, such as 2501.12345v2.');
  for (const key of ['method','variant','source_location','eligibility_evidence']) if(!v(key)) throw Error('Complete the method, variant, source location and eligibility fields.');
  if (!benchmark || benchmark.id !== v('benchmark_id')) throw Error('Choose a registered benchmark.');
  if (!(v('method_class') in METHOD_CLASSES)) throw Error('Choose the architecture class of the neural state.');
  if (!['total','per_site'].includes(v('normalization'))) throw Error('Choose total or per-site energy.');
  const {token, energy, uncertainty: inParentheses} = parseToken(v('energy_token'));
  // The error bar comes from the parentheses, or from its own field when the paper prints it as ±.
  const separate = v('uncertainty_value').replace(/^±\s*/, '');
  if (separate && (!DECIMAL.test(separate) || !(Number(separate) > 0))) throw Error('Enter the error bar as a positive number, for example 0.0004.');
  if (separate && inParentheses !== null && Number(separate) !== Number(inParentheses)) throw Error('The error bar disagrees with the digits in parentheses.');
  const uncertainty = inParentheses ?? (separate || null);
  if (uncertainty === null) throw Error('Every entry needs an error bar: give it in parentheses, as in -0.4976(4), or in the error-bar field if the paper prints it as ±.');
  const uncertaintyType = v('uncertainty_type');
  if (!UNCERTAINTY_TYPES.includes(uncertaintyType)) throw Error('Choose what the error bar means.');
  const variance = v('variance');
  if (variance && (!DECIMAL.test(variance) || Number(variance) < 0)) throw Error('The variance must be a non-negative number.');
  const count = v('parameter_count');
  if (count && !/^\d+$/.test(count)) throw Error('The parameter count must be a whole number.');
  return {schema_version:1,paper:{id:v('paper_id'),title:v('title'),authors:v('authors'),published:'',updated:''},source_url:`https://arxiv.org/pdf/${v('paper_id')}`,source_sha256:null,extraction_model:'human',results:[{benchmark_id:benchmark.id,system_description:`${benchmark.geometry}; ${benchmark.sector}`,method:v('method'),variant:v('variant'),method_class:v('method_class'),method_type:'nqs',energy_type:'variational',reported_here:true,energy,energy_token:token,normalization:v('normalization'),unit:benchmark.unit,uncertainty,uncertainty_type:uncertaintyType,variance:variance||null,source_location:v('source_location'),eligibility_evidence:v('eligibility_evidence'),parameter_count:count?Number(count):null,notes:v('notes')}],issues:[]};
}

// Append the new row to the record that already holds this paper, keeping the stored paper metadata.
// A newer arXiv version replaces the old one in the record; an older version is refused.
export function mergeSubmission(existing, submission) {
  const version = id => Number(id.split('v')[1]);
  if (existing.paper.id.split('v')[0] !== submission.paper.id.split('v')[0]) throw Error('The existing record belongs to a different paper.');
  if (version(submission.paper.id) < version(existing.paper.id)) throw Error(`This paper is already recorded from ${existing.paper.id}; cite that version or a newer one.`);
  const row = submission.results[0], key = r => `${r.benchmark_id}|${r.method.toLowerCase()}|${r.variant.toLowerCase()}`;
  if (existing.results.some(r => key(r) === key(row))) throw Error('This benchmark, method and variant are already recorded for this paper; change the variant label.');
  const newer = version(submission.paper.id) > version(existing.paper.id);
  return {...existing, paper: newer ? {...existing.paper, id: submission.paper.id} : existing.paper, source_url: newer ? submission.source_url : existing.source_url, source_sha256: newer ? null : existing.source_sha256, results: [...existing.results, row]};
}

// ---------------------------------------------------------------------------------------------
// New benchmark instances. A few choices (model, lattice, extents, boundaries, couplings, sector)
// determine the complete entry for data/benchmarks.json, including the key, so that keys and
// conventions stay uniform across contributors. Keys follow the existing ones, for example
// j1j2-square-10x10-pbc-j2-0p5-sz0 and hubbard-square-8x8-pbc-u8-n56-sz0.
const num = s => String(s).trim().replace(/^\+/, '');
const slugNumber = s => num(s).replace('.', 'p');
const pretty = s => num(s).replace('-', '−');
const sub = {1: '₁', 2: '₂'};
export const MODELS = {
  heisenberg: {label: 'Heisenberg', couplings: [], unit: 'J', spin: true, category: 'lattice-spins'},
  j1j2: {label: 'J₁–J₂ Heisenberg', couplings: [['j2', 'J₂/J₁']], unit: 'J1', spin: true, category: 'lattice-spins'},
  tfim: {label: 'Transverse-field Ising', couplings: [['h', 'h/J']], unit: 'J', spin: true, nosector: true, category: 'lattice-spins'},
  hubbard: {label: 'Hubbard', couplings: [['u', 'U/t']], unit: 't', spin: false, category: 'lattice-fermions'},
  ttphubbard: {label: 't–t′ Hubbard', couplings: [['u', 'U/t'], ['tp', 't′/t']], unit: 't', spin: false, category: 'lattice-fermions'},
  custom: {label: 'Other (describe it)', couplings: [], unit: null, spin: null, category: null},
};
export const LATTICES = {square: 'square', rectangular: 'rectangular', triangular: 'triangular', honeycomb: 'honeycomb', chain: 'chain'};
export const BOUNDARIES = {pbc: 'periodic', obc: 'open', cyl: 'cylinder'};

function latticeText(lattice, Lx, Ly, bc) {
  const bcText = {pbc: lattice === 'chain' ? 'periodic' : (lattice === 'triangular' ? 'periodic along both primitive vectors' : 'periodic in both directions'), obc: 'open in all directions', cyl: 'periodic along x, open along y'}[bc];
  const Bc = bcText[0].toUpperCase() + bcText.slice(1);
  if (lattice === 'chain') return {sites: Lx, geometry: `chain of ${Lx} sites; ${bcText}; each nearest-neighbor bond counted once`, label: `${Lx} sites`, size: `${Lx} sites`, bcLabel: Bc};
  if (lattice === 'honeycomb') return {sites: 2 * Lx * Ly, geometry: `${Lx} by ${Ly} honeycomb lattice (two sites per unit cell, ${2 * Lx * Ly} sites); ${bcText}; each nearest-neighbor bond counted once`, label: `${Lx} × ${Ly} cells`, size: `${Lx} × ${Ly} unit cells · ${2 * Lx * Ly} sites`, bcLabel: Bc};
  if (lattice === 'triangular') return {sites: Lx * Ly, geometry: `${Lx} by ${Ly} triangular Bravais lattice; ${bcText}; nearest-neighbor displacements (1,0), (0,1), (1,-1), each undirected bond counted once`, label: `${Lx} × ${Ly}`, size: `${Lx} × ${Ly} · ${Lx * Ly} sites`, bcLabel: Bc};
  return {sites: Lx * Ly, geometry: `${Lx} by ${Ly} ${lattice} lattice; ${bcText}; each nearest-neighbor bond counted once`, label: `${Lx} × ${Ly}`, size: `${Lx} × ${Ly} · ${Lx * Ly} sites`, bcLabel: Bc};
}

export function instanceFromForm(values, existingIds = []) {
  const v = name => String(values[name] ?? '').trim();
  const model = MODELS[v('model')]; if (!model) throw Error('Choose the model.');
  const lattice = v('lattice'); if (!(lattice in LATTICES)) throw Error('Choose the lattice.');
  const bc = v('boundaries'); if (!(bc in BOUNDARIES)) throw Error('Choose the boundary conditions.');
  const Lx = Number(v('lx')), Ly = lattice === 'chain' ? 1 : Number(v('ly'));
  if (!Number.isInteger(Lx) || Lx < 1 || !Number.isInteger(Ly) || Ly < 1) throw Error('Enter whole-number lattice extents.');
  if (lattice === 'square' && Lx !== Ly) throw Error('A square cluster has equal extents; choose "rectangular" otherwise.');
  if (lattice === 'chain' && bc === 'cyl') throw Error('A chain is periodic or open.');
  const geo = latticeText(lattice, Lx, Ly, bc);
  for (const [key] of model.couplings) if (!/^[+-]?\d+(\.\d+)?$/.test(v(key))) throw Error(`Enter ${key === 'j2' ? 'J₂/J₁' : key === 'u' ? 'U/t' : key === 'tp' ? "t′/t" : 'h/J'} as a decimal.`);
  // Models are named by lattice, not by cluster shape: a rectangular cluster is a cluster of the square lattice.
  const latticeWord = lattice === 'rectangular' ? 'Square' : lattice[0].toUpperCase() + lattice.slice(1);
  const extents = lattice === 'chain' ? `${Lx}` : `${Lx}x${Ly}`;
  let entry;
  if (v('model') === 'custom') {
    const name = v('system_name'), ham = v('hamiltonian_text'), unit = v('unit');
    if (!name || !ham || !unit) throw Error('A custom model needs a system name, a plain-text Hamiltonian with its conventions, and an energy unit.');
    if (!v('category')) throw Error('Choose the class of system (for example lattice spins or lattice fermions).');
    const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    entry = {id: `${slug}-${lattice}-${extents}-${bc}${v('sector_text') ? '-' + v('sector_text').toLowerCase().replace(/[^a-z0-9]+/g, '') : ''}`, name, family: name, category: v('category'), sites: geo.sites, geometry: geo.geometry, hamiltonian: ham,
             sector: v('sector_text') || 'Full Hilbert space; ground-state variational calculation', unit, description: v('description') || `${name} on the ${lattice} lattice.`,
             hamiltonian_latex: v('hamiltonian_latex') || '', instance_label: `${geo.label} · ${v('parameters_text') || 'see definition'} · ${BOUNDARIES[bc]}`, lattice_size: geo.size, boundary_conditions: geo.bcLabel, parameters_latex: v('parameters_latex') || ''};
  } else if (model.spin) {
    const sz = v('sz') === '' ? '0' : num(v('sz'));
    if (!model.nosector && !/^-?\d+(\.5)?$/.test(sz)) throw Error('Total Sz must be an integer or half-integer.');
    const sectorKey = model.nosector ? '' : `-sz${slugNumber(sz)}`, sectorText = model.nosector ? 'Full Hilbert space; ground-state variational calculation' : `Total Sz = ${pretty(sz)}; ground-state variational calculation`;
    const names = {heisenberg: `${latticeWord} Heisenberg`, j1j2: `${latticeWord} J₁–J₂`, tfim: `${latticeWord} transverse-field Ising`};
    const defs = {
      heisenberg: {key: '', ham: 'H = J sum_<ij> S_i · S_j; spin-1/2 operators S = sigma/2; J = 1; no constant shift', latex: 'H=J\\sum_{\\langle i,j\\rangle}\\mathbf{S}_i\\cdot\\mathbf{S}_j', params: 'J=1,\\qquad S=\\tfrac12', label: 'J = 1', desc: 'Nearest-neighbor exchange.'},
      j1j2: {key: `-j2-${slugNumber(v('j2'))}`, ham: `H = J1 sum_<ij> S_i · S_j + J2 sum_<<ij>> S_i · S_j; spin-1/2 operators S = sigma/2; J1 = 1; J2 = ${num(v('j2'))}; no constant shift`, latex: 'H=J_1\\!\\sum_{\\langle i,j\\rangle}\\!\\mathbf{S}_i\\!\\cdot\\!\\mathbf{S}_j+J_2\\!\\sum_{\\langle\\!\\langle i,j\\rangle\\!\\rangle}\\!\\mathbf{S}_i\\!\\cdot\\!\\mathbf{S}_j', params: `J_1=1,\\qquad J_2/J_1=${num(v('j2'))},\\qquad S=\\tfrac12`, label: `J₂/J₁ = ${pretty(v('j2'))}`, desc: 'Competing nearest- and next-nearest-neighbor exchange.'},
      tfim: {key: `-h${slugNumber(v('h'))}`, ham: `H = -J sum_<ij> sigma^z_i sigma^z_j - h sum_i sigma^x_i; Pauli matrices; J = 1; h = ${num(v('h'))}; no constant shift`, latex: 'H=-J\\sum_{\\langle i,j\\rangle}\\sigma^z_i\\sigma^z_j-h\\sum_i\\sigma^x_i', params: `J=1,\\qquad h/J=${num(v('h'))}`, label: `h/J = ${pretty(v('h'))}`, desc: 'Ising coupling in a transverse field.'},
    }[v('model')];
    entry = {id: `${v('model')}-${lattice}-${extents}-${bc}${defs.key}${sectorKey}`, name: names[v('model')], family: names[v('model')], category: model.category, sites: geo.sites, geometry: geo.geometry, hamiltonian: defs.ham, sector: sectorText, unit: model.unit,
             description: defs.desc, hamiltonian_latex: defs.latex, instance_label: `${geo.label} · ${defs.label} · ${BOUNDARIES[bc]}${model.nosector ? '' : ` · Sz = ${pretty(sz)}`}`, lattice_size: geo.size, boundary_conditions: geo.bcLabel, parameters_latex: defs.params};
  } else {
    const nup = Number(v('nup')), ndown = Number(v('ndown'));
    if (!Number.isInteger(nup) || !Number.isInteger(ndown) || nup < 0 || ndown < 0 || nup > geo.sites || ndown > geo.sites) throw Error('Enter the numbers of up and down electrons (each between 0 and the number of sites).');
    const n = nup + ndown, tp = v('model') === 'ttphubbard' ? num(v('tp')) : '0', u = num(v('u'));
    const sectorKey = nup === ndown ? `-n${n}-sz0` : `-nup${nup}-ndown${ndown}`;
    const hopping = tp === '0' ? 'nearest-neighbor hopping only' : "nearest-neighbor hopping t and next-nearest-neighbor (diagonal) hopping t'";
    const ham = tp === '0' ? `H = -t sum_<ij>,s (c†_is c_js + h.c.) + U sum_i n_iup n_idown; t = 1; U = ${u}; tprime = 0; no chemical-potential term or constant shift`
                           : `H = -t sum_<ij>,s (c†_is c_js + h.c.) - t' sum_<<ij>>,s (c†_is c_js + h.c.) + U sum_i n_iup n_idown; t = 1; t' = ${tp}; U = ${u}; no chemical-potential term or constant shift`;
    const latex = tp === '0' ? 'H=-t\\!\\sum_{\\langle i,j\\rangle,\\sigma}\\!\\left(c^\\dagger_{i\\sigma}c_{j\\sigma}+\\mathrm{h.c.}\\right)+U\\sum_i n_{i\\uparrow}n_{i\\downarrow}'
                             : "H=-t\\!\\sum_{\\langle i,j\\rangle,\\sigma}\\!\\left(c^\\dagger_{i\\sigma}c_{j\\sigma}+\\mathrm{h.c.}\\right)-t'\\!\\sum_{\\langle\\!\\langle i,j\\rangle\\!\\rangle,\\sigma}\\!\\left(c^\\dagger_{i\\sigma}c_{j\\sigma}+\\mathrm{h.c.}\\right)+U\\sum_i n_{i\\uparrow}n_{i\\downarrow}";
    const name = `${latticeWord} ${tp === '0' ? 'Hubbard' : 't–t′ Hubbard'}`;
    entry = {id: `hubbard-${lattice}-${extents}-${bc}-u${slugNumber(u)}${tp === '0' ? '' : `-tp${slugNumber(tp)}`}${sectorKey}`, name, family: name, category: model.category, sites: geo.sites, geometry: `${geo.geometry.replace('; each nearest-neighbor bond counted once', '')}; ${hopping}`, hamiltonian: ham,
             sector: `Nup = ${nup}; Ndown = ${ndown}; ${n} electrons; ground-state variational calculation`, unit: 't', description: tp === '0' ? 'Interacting fermions hopping on a lattice.' : 'Interacting fermions with nearest- and next-nearest-neighbor hopping.',
             hamiltonian_latex: latex, instance_label: `${geo.label} · U/t = ${pretty(u)}${tp === '0' ? '' : ` · t′/t = ${pretty(tp)}`} · ${BOUNDARIES[bc]} · ${nup === ndown ? `N↑ = N↓ = ${nup}` : `N↑ = ${nup} · N↓ = ${ndown}`}`, lattice_size: geo.size, boundary_conditions: geo.bcLabel,
             parameters_latex: tp === '0' ? `t=1,\\qquad U/t=${u},\\qquad t^{\\prime}=0` : `t=1,\\qquad t'/t=${tp},\\qquad U/t=${u}`};
  }
  if (existingIds.includes(entry.id)) throw Error(`The instance ${entry.id} already exists; choose it from the list instead.`);
  return entry;
}

// The form values that rebuild an existing instance from its template, so that a new instance of the same model
// starts from it and only what differs is changed. Null when no template rebuilds it exactly (an instance written
// by a curator, such as the kagome or t–V instances); those are proposed for a curator instead.
export function newInstanceValues(b) {
  const unslug = s => s.replace('p', '.');
  const m = /^(heisenberg|j1j2|tfim|hubbard)-(square|rectangular|triangular|honeycomb|chain)-(\d+)(?:x(\d+))?-(pbc|obc|cyl)(.*)$/.exec(b.id);
  if (!m) return null;
  const [, model, lattice, lx, ly, boundaries, rest] = m;
  const values = {category: b.category, instance_mode: 'new', lattice, lx, ly: ly || '', boundaries};
  let p;
  if (model === 'heisenberg' && (p = /^-sz(-?[\dp]+)$/.exec(rest))) Object.assign(values, {model, sz: unslug(p[1])});
  else if (model === 'j1j2' && (p = /^-j2-(-?[\dp]+)-sz(-?[\dp]+)$/.exec(rest))) Object.assign(values, {model, j2: unslug(p[1]), sz: unslug(p[2])});
  else if (model === 'tfim' && (p = /^-h(-?[\dp]+)$/.exec(rest))) Object.assign(values, {model, h: unslug(p[1])});
  else if (model === 'hubbard' && (p = /^-u([\dp]+)(?:-tp(-?[\dp]+))?-(?:n(\d+)-sz0|nup(\d+)-ndown(\d+))$/.exec(rest))) {
    const [, u, tp, n, nup, ndown] = p;
    Object.assign(values, {model: tp ? 'ttphubbard' : 'hubbard', u: unslug(u), ...(tp ? {tp: unslug(tp)} : {}), nup: n ? String(n / 2) : nup, ndown: n ? String(n / 2) : ndown});
  } else return null;
  try { const rebuilt = instanceFromForm(values); return rebuilt.id === b.id && rebuilt.family === b.family ? values : null; } catch { return null; }
}

// A result whose instance is not defined yet: stored under data/proposals/, never published,
// until a curator adds the definition and moves the row to data/results/.
export function makeProposal(values) {
  const v = name => String(values[name] ?? '').trim();
  if (!v('system_description') || !v('unit')) throw Error('Describe the system completely (Hamiltonian, convention, cluster, boundaries, couplings, sector) and give the energy unit.');
  const record = makeSubmission(values, {id: v('benchmark_id') || '__proposal__', geometry: '', sector: '', unit: v('unit')});
  const category = v('category_label') || v('category');
  record.results[0].benchmark_id = null; record.results[0].system_description = (category ? `${category}. ` : '') + v('system_description');
  return record;
}
