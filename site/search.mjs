// Ketboard search. A query in words, such as "the J1-J2 instances on the square lattice at J2 = 0.5", becomes
// filters on the instances (model, lattice, boundaries, size, couplings, particle sector), shown as chips the reader
// can remove. Pure functions without DOM access, so the module runs in the browser and in scripts/check-search.mjs.
//   1. facetsOf: an instance as names and numbers, read from its definition in data/benchmarks.json.
//   2. tagQuery: the query cut into tokens, each tagged from a vocabulary built from the instances and the aliases
//      below. A learned tagger (search-tagger.mjs) may label the words this vocabulary does not know.
//   3. resolve: tagged tokens to filters; a number is paired with the parameter, unit or operator next to it.
//   4. searchInstances: the instances that pass every filter or, when none does, the closest ones.
import {boundaryClass} from './leaderboard.mjs';

// ---------------------------------------------------------------------------------------------------------------
// Text normalization. Subscripts, accents, dashes and primes are folded so that "J₂/J₁", "j2/j1", "Kagomé" and
// "t′" are read the same way; each normalized character remembers its position in the query, for the chips.
const DASHES = /[‐-―−﹣－]/g, PRIMES = /[′’‘ʹ´`]/g;
function normalizeChar(ch) {
  return ch.normalize('NFKD').replace(/\p{M}/gu, '').replace(DASHES, '-').replace(PRIMES, "'").replace(/⁄/g, '/').replace(/×/g, 'x').toLowerCase();
}
export function normalize(text) { return [...String(text)].map(normalizeChar).join(''); }
function normalizeWithMap(text) {
  let out = '', i = 0; const map = [];
  for (const ch of String(text)) { const n = normalizeChar(ch); for (let k = 0; k < n.length; k++) map.push(i); out += n; i += ch.length; }
  map.push(i);
  return {text: out, map};
}
// The form under which words are compared: no hyphens, underscores or parentheses, and no plural s.
export function loose(word) {
  let s = word.replace(/[-_()]/g, '');
  if (s.length > 3 && s.endsWith('ies')) s = s.slice(0, -3) + 'y';
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss') && !s.endsWith("'s")) s = s.slice(0, -1);
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
// Tokens: sizes (10x10, 2 × 2 × 2, 8 by 4), dimensions (2D), numbers (0.5, -0.2, .5, 1/8, 12.5%), operators and
// words. A minus sign belongs to a number only after a space, an operator or the start ("t' = -0.2"); between two
// numbers it is a range ("0.4-0.6"). "spin-1/2" reads as the parameter S.
const TOKEN = /(?<size>\d+(?:\s*(?:x|\*|by)\s*\d+){1,2}(?![\d.]))|(?<dimension>(?<![\p{L}\p{N}])[123]-?d(?![\p{L}\p{N}]))|(?<spin>(?<![\p{L}\p{N}])spin[- ]?(?=\d))|(?<num>(?:(?<![\p{L}\p{N}.')])[-+])?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*\/\s*\d+)?(?:\s*%)?)|(?<op>>=|<=|=>|=<|==|≥|≤|≈|~|=|<|>|:|,|-|→|\.\.)|(?<word>[\p{L}_][\p{L}\p{N}_'↑↓()]*(?:[-/][\p{L}_'][\p{L}\p{N}_'↑↓()]*)*)/gu;

function parseNumber(text) {
  let t = text.replace(/\s+/g, ''), scale = 1;
  if (t.endsWith('%')) { scale = 0.01; t = t.slice(0, -1); }
  const fraction = /^([-+]?\d+(?:\.\d+)?)\/(\d+)$/.exec(t);
  if (fraction) return {value: Number(fraction[1]) / Number(fraction[2]) * scale, decimals: null, text: t + (scale === 1 ? '' : '%')};
  const decimals = t.includes('.') ? t.split('.')[1].length : 0;
  return {value: Number(t) * scale, decimals: decimals + (scale === 1 ? 0 : 2), text: t + (scale === 1 ? '' : '%')};
}

export function tokenize(query) {
  const {text, map} = normalizeWithMap(query), tokens = [];
  for (const m of text.matchAll(TOKEN)) {
    const g = m.groups; let start = m.index, end = start + m[0].length, word = m[0], kind, value = null;
    if (g.size) { kind = 'size'; value = word.split(/\s*(?:x|\*|by)\s*/).map(Number); word = value.join('x'); }
    else if (g.dimension) { kind = 'dim'; value = Number(word[0]); word = word[0] + 'd'; }
    else if (g.spin) { kind = 'word'; word = 's'; }
    else if (g.num) { kind = 'num'; value = parseNumber(word); word = value.text; }
    else if (g.op) kind = 'op';
    else {
      kind = 'word';
      // Parentheses belong to a word only when balanced, as in su(2); a possessive 's is dropped.
      while (word.endsWith(')') && (word.match(/\(/g) || []).length < (word.match(/\)/g) || []).length) { word = word.slice(0, -1); end--; }
      if (word.includes('(') && !word.includes(')')) { end -= word.length - word.indexOf('('); word = word.slice(0, word.indexOf('(')); }
      if (word.length > 3 && word.endsWith("'s")) { word = word.slice(0, -2); end -= 2; }
      if (!word) continue;
    }
    tokens.push({kind, text: word, value, start: map[start], end: map[end], raw: String(query).slice(map[start], map[end])});
  }
  return tokens;
}

// ---------------------------------------------------------------------------------------------------------------
// Facets of an instance.
const SUBSCRIPT = {0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉'};
function latexKey(s) {
  return s.replace(/\\uparrow/g, '↑').replace(/\\downarrow/g, '↓').replace(/\^\{?\\prime\}?/g, "'").replace(/\\prime/g, "'").replace(/\\omega/g, 'omega').replace(/\\lambda/g, 'lambda')
    .replace(/\\[a-zA-Z]+/g, '').replace(/[{}_\s]/g, '').replace(/′/g, "'").toLowerCase();
}
function latexLabel(s) {
  return s.replace(/_\{?\\uparrow\}?/g, '↑').replace(/_\{?\\downarrow\}?/g, '↓').replace(/\^\{?\\prime\}?/g, '′').replace(/'/g, '′').replace(/\\omega/g, 'ω').replace(/\\lambda/g, 'λ')
    .replace(/_\{?(\d)\}?/g, (_, d) => SUBSCRIPT[d]).replace(/_\{?([A-Za-z])\}?/g, '_$1').replace(/\^\{?2\}?/g, '²').replace(/\\[a-zA-Z]+/g, '').replace(/[{}\s]/g, '');
}
function latexValue(rhs) {
  const approx = /\\approx\s*(-?\d+(?:\.\d+)?)/.exec(rhs);
  if (approx) return {value: Number(approx[1]), approx: true};
  const t = rhs.replace(/\\[td]?frac\{?(\d+)\}?\{?(\d+)\}?/, '$1/$2').replace(/\s+/g, '');
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return {value: Number(t), approx: false};
  const fraction = /^(-?\d+)\/(\d+)$/.exec(t);
  return fraction ? {value: Number(fraction[1]) / Number(fraction[2]), approx: false} : null;
}
// Couplings that only fix the energy unit (J₁ = 1, t = 1) and the spin length are not "values" of an instance
// when a bare number is searched.
const UNIT_KEYS = new Set(['j', 'j1', 't', "j'"]);
export function parametersOf(latex) {
  const out = [];
  for (const item of String(latex || '').split(/,?\s*\\qquad\s*|,\s+/)) {
    const parts = item.split('=');
    if (parts.length < 2) continue;
    const parsed = latexValue(parts[parts.length - 1]);
    if (!parsed || !Number.isFinite(parsed.value)) continue;
    const key = latexKey(parts[0]);
    if (!key) continue;
    out.push({key, base: key.split('/')[0], label: latexLabel(parts[0].trim()), ...parsed, unit: key === 's' || (UNIT_KEYS.has(key) && parsed.value === 1)});
  }
  return out;
}

const PART_DIMENSION = {Chain: 1, Square: 2, Triangular: 2, Honeycomb: 2, Kagome: 2, Pyrochlore: 3};
function dimsOf(b) {
  const m = /^(\d+)\s*×\s*(\d+)(?:\s*×\s*(\d+))?/.exec(b.lattice_size || '');
  if (m) return m.slice(1).filter(Boolean).map(Number);
  if (b.part === 'Chain') return [b.sites];
  const c = /^(\d+)\s*×\s*(\d+)\s*×\s*(\d+)/.exec(b.system?.space?.cell || '');
  return c ? c.slice(1).map(Number) : null;
}
function particlesOf(b) {
  if (b.system) {
    let up = 0, down = 0, count = 0;
    for (const p of b.system.particles || []) { up += Number(p.up || 0); down += Number(p.down || 0); count += Number(p.count || 0); }
    return {up, down, total: up + down + count, kind: 'electrons'};
  }
  const s = b.sector || '';
  let m = /Nup = (\d+); Ndown = (\d+)/.exec(s);
  if (m) return {up: Number(m[1]), down: Number(m[2]), total: Number(m[1]) + Number(m[2]), kind: 'electrons'};
  m = /\bN(?:_[a-z])? = (\d+) ([a-z -]+)/i.exec(s);
  if (m) return {up: null, down: null, total: Number(m[1]), kind: m[2].trim()};
  return null;
}
function wordsOf(text) { return new Set(tokenize(text).filter(t => t.kind === 'word' || t.kind === 'dim').map(t => loose(t.text))); }

export function facetsOf(b) {
  const lattice = b.category !== 'continuum-electrons', params = parametersOf(b.parameters_latex);
  const particles = particlesOf(b), dims = dimsOf(b), sector = b.sector || '';
  const has = key => params.some(p => p.key === key);
  if (!lattice) {
    // Particle numbers of a continuum instance are its particles facet, not couplings.
    for (let k = params.length - 1; k >= 0; k--) if (['n↑', 'n↓', 'n', 'm'].includes(params[k].key)) params.splice(k, 1);
    const space = b.system?.space || {}, external = b.system?.external || {};
    const rs = space.r_s ?? /rₛ = (\d+(?:\.\d+)?)/.exec(`${external.geometry || ''} ${b.instance_label || ''}`)?.[1];
    if (rs !== undefined && !has('rs')) params.push({key: 'rs', base: 'rs', label: 'rₛ', value: Number(rs), approx: false, unit: false});
    if (external.omega !== undefined && !has('omega')) params.push({key: 'omega', base: 'omega', label: 'ω', value: Number(external.omega), approx: false, unit: false});
    const bond = /\bR = (\d+(?:\.\d+)?) bohr/.exec(`${external.geometry || ''} · ${b.instance_label || ''}`);
    if (bond) params.push({key: 'r', base: 'r', label: 'R (bohr)', value: Number(bond[1]), approx: false, unit: false});
    if (external.charge !== undefined) params.push({key: 'charge', base: 'charge', label: 'charge', value: Number(external.charge), approx: false, unit: false});
  }
  let filling = null, density = null, doping = null;
  if (lattice && particles) {
    density = particles.total / b.sites;
    if (particles.up !== null || /conduction electrons/.test(particles.kind)) { filling = particles.total / (2 * b.sites); doping = 1 - particles.total / b.sites; }
    else if (/spinless|hard-core/.test(particles.kind)) filling = density;
  }
  if (/half filling/.test(sector)) filling = 0.5;
  if (/unit filling/.test(sector)) density = 1;
  const holeDoping = /(\d+)\/(\d+) hole doping|hole doping (\d+)\/(\d+)/.exec(sector);
  if (holeDoping) doping = Number(holeDoping[1] ?? holeDoping[3]) / Number(holeDoping[2] ?? holeDoping[4]);
  const szText = /total S\^?z = (-?\d+(?:\/\d+)?)/i.exec(sector)?.[1];
  const sz = particles?.up !== null && particles?.up !== undefined ? (particles.up - particles.down) / 2 : szText !== undefined ? latexValue(szText).value : null;
  const words = wordsOf([b.family, b.part, b.instance_label, b.description, b.geometry, sector, b.group, b.boundary_conditions].filter(Boolean).join(' '));
  return {
    id: b.id, benchmark: b, category: b.category, family: b.family, part: b.part, lattice,
    boundary: lattice ? boundaryClass(b) : (b.system?.space?.type === 'periodic' ? 'Periodic' : 'Free space'),
    dimension: lattice ? PART_DIMENSION[b.part] ?? null : b.system?.dimension ?? null,
    sites: b.sites, dims, params, particles, filling, density, doping, sz,
    polarized: particles && particles.up !== null ? (particles.down === 0 && particles.up > 0 ? true : particles.up === particles.down ? false : null) : null,
    words, wordList: [...words], nameWords: lattice ? null : wordsOf(b.part),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Vocabulary: phrases and the tag each one gets. Names of models, lattices and systems come from the data; the
// lists below add the other ways people write them.
const FAMILY_ALIASES = {
  'J₁–J₂ Heisenberg': ['j1-j2', 'j1-j2 model', 'frustrated heisenberg', 'j1-j2 heisenberg model', 'heisenberg j1-j2'],
  'Heisenberg': ['heisenberg model', 'heisenberg antiferromagnet', 'xxx', 'xxx model', 'nearest-neighbor heisenberg'],
  'Transverse-field Ising': ['tfim', 'tfi', 'ising', 'ising model', 'transverse ising', 'quantum ising', 'transverse field ising model', 'tfi model'],
  'Shastry–Sutherland': ['ssm', 'shastry-sutherland model', 'orthogonal dimer model'],
  'Hubbard': ['hubbard model', 'fermi-hubbard', 'fermi-hubbard model'],
  't–t′ Hubbard': ["t-t'", "t-t' model", "t-t'-u", "t-t' hubbard model", 'tprime hubbard'],
  't–V': ['t-v model', 'spinless fermion model', 't-v spinless fermions'],
  'Holstein': ['holstein model', 'electron-phonon', 'electron-phonon model', 'polaron'],
  'Kondo–Heisenberg': ['kondo', 'kondo lattice', 'kondo-heisenberg model', 'kondo heisenberg lattice'],
  'SU(2) lattice gauge theory': ['su(2)', 'su(2) gauge theory', 'su(2) gauge', 'su(2) lgt', 'non-abelian gauge theory', 'yang-mills'],
  'Z₂ lattice gauge theory': ['z2', 'z2 gauge theory', 'z2 gauge', 'z2 lgt', 'ising gauge theory', 'z2 gauge field'],
  'Bose–Hubbard': ['bose-hubbard model', 'bosonic hubbard', 'boson hubbard'],
  'Electron gas': ['heg', 'ueg', 'jellium', 'homogeneous electron gas', 'uniform electron gas', 'electron liquid', 'wigner crystal'],
  '2D quantum dot': ['quantum dot', 'harmonic trap', 'trapped electrons', 'harmonic quantum dot', 'parabolic quantum dot', 'quantum dots in a trap'],
  'Atoms and molecules': ['molecule', 'atom', 'molecular', 'chemistry', 'quantum chemistry', 'atoms and molecule'],
  'Solids': ['solid', 'crystal', 'periodic solid', 'material', 'crystalline solid'],
};
// A model with one coupling set to zero is another model on Ketboard: J₁–J₂ at J₂ = 0 is the Heisenberg model. When
// no instance of the named model matches, the search shows its special case ("kagome J1-J2" finds kagome Heisenberg).
const SPECIAL_CASES = {
  'J₁–J₂ Heisenberg': {family: 'Heisenberg', param: 'j2', condition: 'J₂ = 0'},
  't–t′ Hubbard': {family: 'Hubbard', param: "t'", condition: 't′ = 0'},
};
const PART_ALIASES = {
  Square: ['rectangular', 'square lattice', 'square-lattice'], Triangular: ['triangle', 'triangular lattice'],
  Honeycomb: ['hexagonal', 'honeycomb lattice'], Kagome: ['kagome lattice'], Pyrochlore: ['pyrochlore lattice'],
  Chain: ['spin chain', 'linear chain', 'ring', 'chain lattice'],
};
const BOUNDARY_ALIASES = {
  Periodic: ['periodic', 'pbc', 'torus', 'periodic boundary', 'periodic boundary condition', 'periodic bc', 'fully periodic'],
  Open: ['open', 'obc', 'open boundary', 'open boundary condition', 'open bc', 'open cluster'],
  Cylinder: ['cylinder', 'cylindrical', 'cyl', 'cylinder geometry'],
  'Periodic × antiperiodic': ['antiperiodic', 'apbc', 'periodic-antiperiodic', 'periodic antiperiodic', 'mixed boundary', 'pa'],
  'Free space': ['free space', 'isolated', 'open space', 'non-periodic', 'nonperiodic', 'free boundary'],
};
const CATEGORY_ALIASES = {
  'lattice-spins': ['spin', 'spin model', 'spin system', 'magnet', 'quantum magnet', 'magnetism', 'antiferromagnet', 'quantum spin'],
  'lattice-fermions': ['fermion', 'fermionic', 'lattice electron', 'correlated electron', 'fermions on a lattice', 'electrons on a lattice'],
  'lattice-bosons': ['boson', 'bosonic', 'bosons on a lattice'],
  'continuum-electrons': ['continuum', 'continuous space', 'real space', 'first quantization', 'first-quantized', 'ab initio', 'electronic structure'],
};
// Parameter names: each alias stands for the base of a key as instances write it (j2 for J₂/J₁, u for U/t or U/J).
// Special names: l (linear size), n (sites or particles), sites, particles, nup, ndown, sz, doping.
const PARAM_ALIASES = {
  j2: ['j2', 'j2/j1', 'j2/j', 'jnnn', 'next-nearest-neighbor coupling', 'next-nearest-neighbour coupling', 'next nearest neighbor coupling', 'nnn coupling', 'diagonal coupling', 'frustration', 'frustration ratio', 'second-neighbor coupling'],
  u: ['u', 'u/t', 'u/j', 'on-site interaction', 'onsite interaction', 'on-site repulsion', 'onsite repulsion', 'interaction strength', 'on-site coupling'],
  "t'": ["t'", "t'/t", 'tp', 'tprime', "t-prime", 'next-nearest-neighbor hopping', 'next nearest neighbor hopping', 'nnn hopping', 'diagonal hopping', 'second-neighbor hopping'],
  h: ['h', 'h/j', 'h/t', 'hx', 'field', 'transverse field', 'magnetic field', 'field strength'],
  v: ['v', 'v/t', 'nearest-neighbor repulsion', 'nearest neighbor repulsion', 'nn repulsion', 'nearest-neighbor interaction'],
  jk: ['jk', 'j_k', 'jk/t', 'kondo coupling'], omega0: ['omega0', 'ω0', 'omega_0', 'phonon frequency'],
  g: ['g', 'g/t', 'electron-phonon coupling'], lambda: ['lambda', 'λ'],
  rs: ['rs', 'r_s', 'density parameter', 'wigner-seitz radius', 'wigner seitz radius', 'density'],
  omega: ['omega', 'ω', 'trap frequency', 'confinement strength', 'oscillator frequency', 'frequency', 'confinement'],
  r: ['r', 'bond length', 'bond distance', 'interatomic distance', 'internuclear distance', 'distance', 'separation', 'bond'],
  charge: ['charge', 'q', 'net charge'], s: ['s', 'spin length'],
  l: ['l', 'linear size', 'side length', 'linear dimension', 'length'],
  n: ['n'], sites: ['site', 'nsite', 'n_site', 'number of site', 'lattice site', 'spins', 'size'],
  particles: ['electron', 'particle', 'ne', 'n_e', 'nelec', 'number of electron', 'number of particle', 'nf', 'nb', 'n_f', 'n_b', 'filling n'],
  nup: ['nup', 'n_up', 'n↑', 'up electron', 'spin-up electron', 'nu'], ndown: ['ndown', 'n_down', 'ndn', 'n↓', 'down electron', 'spin-down electron', 'nd'],
  sz: ['sz', 's_z', 'total sz', 'magnetization', 'mz', 's^z'], doping: ['doping', 'hole doping', 'δ', 'delta', 'doping level', 'hole concentration'],
};
const SPECIAL_PARAMS = new Set(['l', 'n', 'sites', 'particles', 'nup', 'ndown', 'sz', 'doping']);
const FILLING_ALIASES = {
  half: ['half filling', 'half-filled', 'half filled', 'half-filling', 'undoped', 'at half filling'], unit: ['unit filling', 'integer filling', 'filling one'],
  doped: ['doped', 'hole-doped', 'hole doped', 'away from half filling', 'finite doping'],
  polarized: ['polarized', 'fully polarized', 'spin-polarized', 'spin polarized', 'ferromagnetic'], unpolarized: ['unpolarized', 'paramagnetic', 'spin-unpolarized', 'spin unpolarized'],
};
// Superlatives keep the instances at the extreme of what is shown. "Largest" and "smallest" mean the size unless a
// parameter follows ("largest U"); "highest", "lowest" and the like need a parameter, so "lowest energy" is not one.
const EXTREME_ALIASES = {
  max: ['largest', 'biggest', 'largest size', 'biggest size', 'largest system', 'biggest system', 'largest lattice', 'largest cluster', 'largest instance',
    'max size', 'maximum size', 'maximal size', 'most sites', 'most spins', 'largest number of sites'],
  min: ['smallest', 'smallest size', 'smallest system', 'smallest lattice', 'smallest cluster', 'smallest instance', 'min size', 'minimum size', 'minimal size',
    'fewest sites', 'fewest spins', 'smallest number of sites'],
};
const EXTREME_PARAM_ALIASES = {max: ['highest', 'maximum', 'max', 'maximal', 'most', 'strongest', 'greatest'], min: ['lowest', 'minimum', 'min', 'minimal', 'fewest', 'weakest', 'least']};
const OP_ALIASES = {
  eq: ['=', '==', ':', 'is', 'equal', 'equal to', 'equals', 'of', 'at', 'with'],
  gt: ['>', 'above', 'over', 'greater than', 'larger than', 'more than', 'bigger than', 'higher than', 'exceeding', 'beyond'],
  ge: ['>=', '=>', '≥', 'at least', 'no less than', 'no fewer than'],
  lt: ['<', 'below', 'under', 'less than', 'smaller than', 'fewer than', 'lower than'],
  le: ['<=', '=<', '≤', 'at most', 'up to', 'no more than', 'no larger than'],
  approx: ['~', '≈', 'around', 'about', 'near', 'approximately', 'roughly', 'close to', 'circa', 'approx', 'nearly'],
  between: ['between', 'in the range', 'within'], from: ['from'], join: ['-', 'to', '..', 'and', '→'], list: [',', 'or'],
};
const STOP = ['the', 'a', 'an', 'all', 'any', 'show', 'me', 'find', 'list', 'get', 'give', 'which', 'what', 'are', 'there', 'instance', 'model', 'lattice',
  'system', 'problem', 'benchmark', 'result', 'energy', 'energies', 'ground', 'state', 'nqs', 'neural', 'variational', 'case', 'please', 'those', 'these',
  'that', 'this', 'on', 'in', 'for', 'by', 'boundary', 'boundary condition', 'condition', 'bc', 'cluster', 'geometry', 'value', 'coupling', 'ratio', 'parameter',
  'where', 'whose', 'having', 'has', 'have', 'i', 'want', 'need', 'look', 'looking', 'like', 'some', 'every', 'each', 'sector', 'calculation', 'hole',
  'bohr', 'angstrom', 'å', 'ha', 'hartree', 'unit', 'units', 'per', 'spinless', 'hard-core', 'conduction', 'localized', 'only', 'just', 'also', 'same', 'different', 'version',
  'version of', 'one', 'two', 'other', 'type', 'kind', 'family', 'class', 'dimension', 'dimensional', 'size of', 'filling', 'its', 'their', 'it', 'they',
  'do', 'does', 'did', 'can', 'could', 'would', 'should', 'you', 'we', 'how', 'many', 'much', 'known', 'available', 'listed', 'reported', 'paper', 'papers',
  'up', 'down', 'tilted', 'sample', 'samples', 'data', 'board', 'ketboard', 'search', 'quantum', 'entry', 'entries', 'number', 'number of', 'not', 'no'];
const ELEMENTS = {hydrogen: 'H', helium: 'He', lithium: 'Li', beryllium: 'Be', boron: 'B', carbon: 'C', nitrogen: 'N', oxygen: 'O', fluorine: 'F', neon: 'Ne',
  sodium: 'Na', magnesium: 'Mg', aluminium: 'Al', aluminum: 'Al', silicon: 'Si', phosphorus: 'P', sulfur: 'S', sulphur: 'S', chlorine: 'Cl', argon: 'Ar',
  potassium: 'K', calcium: 'Ca', scandium: 'Sc', titanium: 'Ti', vanadium: 'V', chromium: 'Cr', manganese: 'Mn', iron: 'Fe', cobalt: 'Co', nickel: 'Ni',
  copper: 'Cu', zinc: 'Zn', gallium: 'Ga', germanium: 'Ge', arsenic: 'As', selenium: 'Se', bromine: 'Br', krypton: 'Kr'};
const NAME_ALIASES = {water: ['H₂O'], ammonia: ['NH₃'], methane: ['CH₄'], 'carbon monoxide': ['CO'], 'carbon tetrachloride': ['CCl₄'], ethylene: ['Ethene'],
  dinitrogen: ['N₂'], 'nitrogen molecule': ['N₂'], 'nitrogen dimer': ['N₂'], 'hydrogen molecule': ['H₂'], lih: ['LiH', 'Lithium hydride'],
  'lithium hydride': ['LiH', 'Lithium hydride'], 'beryllium oxide': ['BeO'], 'hydrogen chain': ['H₄', 'H₆', 'H₈', 'H₁₀', 'Hydrogen'], 'transition state': [],
  isoprene: ['s-trans cis-C₅H₈'], 'hydrogen cyanide': ['HCN'], 'lithium cyanide': ['LiCN']};
const NOT_NAME_WORDS = new Set(['ts', 'of', 'h', 'n', 'o', 'c', 'f', 'k', 'p', 's', 'v', 'b', 'image', 'scan', 'complex']);

const phraseKey = tokens => tokens.map(t => loose(t.text)).join(' ');
const compactKey = tokens => tokens.map(t => loose(t.text)).join('');
const MAX_PHRASE = 5;
// Tag priority when two lists give the same phrase: earlier wins.
const PRIORITY = ['op', 'filling', 'extreme', 'family', 'part', 'dim', 'boundary', 'category', 'param', 'name', 'stop'];

export function buildVocabulary(benchmarks, facets = benchmarks.map(facetsOf)) {
  const phrases = new Map(), compact = new Map(), caseNames = new Map();
  const add = (phrase, type, value, extra = {}) => {
    const tokens = tokenize(phrase).filter(t => t.kind === 'word' || t.kind === 'dim' || t.kind === 'op');
    if (!tokens.length || tokens.length > MAX_PHRASE) return;
    const entry = {type, value, ...extra};
    for (const [map, key] of [[phrases, phraseKey(tokens)], [compact, compactKey(tokens)]]) {
      const old = map.get(key);
      // A system's own name or formula wins over the words of other names that contain it (N₂, not "TS of … N₂").
      if (old && type === 'name' && old.type === 'name') { if (old.word && !extra.word) map.set(key, entry); else if (Boolean(old.word) === Boolean(extra.word)) old.value = [...new Set([...old.value, ...value])]; continue; }
      if (!old || PRIORITY.indexOf(type) < PRIORITY.indexOf(old.type)) map.set(key, entry);
    }
  };
  for (const [value, list] of Object.entries(OP_ALIASES)) list.forEach(p => add(p, 'op', value));
  for (const [value, list] of Object.entries(FILLING_ALIASES)) list.forEach(p => add(p, 'filling', value));
  for (const [value, list] of Object.entries(EXTREME_ALIASES)) list.forEach(p => add(p, 'extreme', value));
  for (const [value, list] of Object.entries(EXTREME_PARAM_ALIASES)) list.forEach(p => add(p, 'extreme', value, {needsParam: true}));
  const families = [...new Set(benchmarks.map(b => b.family))], categories = [...new Set(benchmarks.map(b => b.category))];
  for (const family of families) { add(family, 'family', family); (FAMILY_ALIASES[family] || []).forEach(p => add(p, 'family', family)); }
  const latticeParts = new Set(facets.filter(f => f.lattice).map(f => f.part));
  for (const part of latticeParts) { add(part, 'part', part); (PART_ALIASES[part] || []).forEach(p => add(p, 'part', part)); }
  for (const [value, list] of Object.entries(BOUNDARY_ALIASES)) list.forEach(p => add(p, 'boundary', value));
  for (const category of categories) { add(category.replace('-', ' '), 'category', category); (CATEGORY_ALIASES[category] || []).forEach(p => add(p, 'category', category)); }
  const paramNames = new Set(Object.keys(PARAM_ALIASES));
  for (const f of facets) for (const p of f.params) { paramNames.add(p.key); paramNames.add(p.base); }
  for (const name of paramNames) add(name, 'param', name, {needsValue: loose(name).length <= 1});
  for (const [name, list] of Object.entries(PARAM_ALIASES)) list.forEach(p => add(p, 'param', name, {needsValue: loose(p).length <= 1}));
  for (const [phrase, value] of [['one-dimensional', 1], ['one dimensional', 1], ['two-dimensional', 2], ['two dimensional', 2], ['three-dimensional', 3], ['three dimensional', 3]]) add(phrase, 'dim', value);
  // Systems in continuous space (atoms, molecules, solids) are searched by name, formula or element.
  const nameParts = [...new Set(facets.filter(f => !f.lattice && !/^\dD$/.test(f.part)).map(f => f.part))];
  for (const part of nameParts) {
    const n = normalize(part);
    if (/\d/.test(n) || n.replace(/[^\p{L}]/gu, '').length >= 3) add(part, 'name', [part]);
    caseNames.set(part, part);
    for (const t of tokenize(part)) if (t.kind === 'word' && !NOT_NAME_WORDS.has(t.text) && (t.text.length >= 3 || /\d/.test(t.text)) && !STOP.includes(t.text)) add(t.text, 'name', [part], {word: true});
  }
  for (const [element, symbol] of Object.entries(ELEMENTS)) {
    const parts = nameParts.filter(p => p === symbol || new RegExp(`^${symbol}[₀-₉]+$`).test(p) || normalize(p) === element);
    if (parts.length) add(element, 'name', parts);
  }
  for (const [alias, parts] of Object.entries(NAME_ALIASES)) { const present = parts.filter(p => nameParts.includes(p)); if (present.length) add(alias, 'name', present); }
  const transitionStates = nameParts.filter(p => p.startsWith('TS of'));
  if (transitionStates.length) ['transition state', 'transition-state', 'barrier height'].forEach(p => add(p, 'name', transitionStates));
  STOP.forEach(p => add(p, 'stop', null));
  const stops = new Set(STOP.map(p => phraseKey(tokenize(p))));
  const single = [...phrases.entries()].filter(([key, e]) => !key.includes(' ') && key.length >= 4 && (['family', 'part', 'boundary', 'category', 'name', 'filling'].includes(e.type) || (e.type === 'extreme' && !e.needsParam)) && !(e.type === 'name' && e.word));
  const dataWords = new Set(facets.flatMap(f => f.wordList));
  return {phrases, compact, caseNames, single, nameParts, stops, dataWords};
}

// ---------------------------------------------------------------------------------------------------------------
// Tagging. Each tag covers tokens [from, to) and the characters [start, end) of the query.
function editDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const d = Array.from({length: a.length + 1}, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > limit) return limit + 1;
  }
  return d[a.length][b.length];
}
const isValue = t => t && (t.kind === 'num' || t.kind === 'size' || (t.kind === 'op' && !['-', ',', '→', '..'].includes(t.text)));
// A value follows: a number or size, a comparison sign, or comparison words ("at least", "between", "of").
function valueFollows(tokens, i, vocab) {
  if (isValue(tokens[i])) return true;
  for (let k = 3; k >= 1; k--) {
    const span = tokens.slice(i, i + k);
    if (span.length === k && span.every(t => t.kind === 'word') && vocab.phrases.get(phraseKey(span))?.type === 'op') return isValue(tokens[i + k]) || valueFollows(tokens, i + k, vocab);
  }
  return false;
}

// Words glued to a number ("u8", "rs10", "l16") are split when the letters name a parameter, unless the whole word
// is used by an instance (the S22 and G3 datasets, BH76).
function splitGlued(tokens, vocab) {
  const out = [];
  for (const t of tokens) {
    const m = t.kind === 'word' && !vocab.phrases.has(loose(t.text)) && !vocab.dataWords.has(loose(t.text)) && /^([\p{L}']+?)(\d+(?:\.\d+)?)$/u.exec(t.text);
    const entry = m && vocab.phrases.get(loose(m[1]));
    if (entry?.type === 'param') {
      const cut = t.start + m[1].length;
      out.push({...t, text: m[1], end: cut, raw: t.raw.slice(0, m[1].length)}, {kind: 'num', text: m[2], value: parseNumber(m[2]), start: cut, end: t.end, raw: t.raw.slice(m[1].length)});
    } else out.push(t);
  }
  return out;
}

export function ruleTags(tokens, vocab) {
  const tags = [];
  const push = (type, value, from, to, extra = {}) => tags.push({type, value, from, to, start: tokens[from].start, end: tokens[to - 1].end, text: tokens.slice(from, to).map(t => t.raw).join(' '), ...extra});
  // A one-letter parameter needs a value ("U = 8"), except after a superlative ("largest U", "highest value of h").
  const afterExtreme = () => {
    for (let k = tags.length - 1; k >= Math.max(0, tags.length - 3); k--) {
      if (tags[k].type === 'extreme') return true;
      if (tags[k].type !== 'stop' && !(tags[k].type === 'op' && tags[k].value === 'eq')) return false;
    }
    return false;
  };
  for (let i = 0; i < tokens.length;) {
    const t = tokens[i];
    if (t.kind === 'num' || t.kind === 'size') { push(t.kind, t.value, i, i + 1); i++; continue; }
    if (t.kind === 'dim') {
      const phrase = [3, 2].map(k => tokens.slice(i, i + k)).find(span => span.length > 1 && span.every(x => x.kind === 'word' || x.kind === 'dim') && vocab.phrases.get(phraseKey(span))?.type === 'family');
      if (phrase) { push('family', vocab.phrases.get(phraseKey(phrase)).value, i, i + phrase.length); i += phrase.length; continue; }
      push('dim', t.value, i, i + 1); i++; continue;
    }
    // A capitalized element symbol or formula (Ne, Fe, CO) names a system unless a value follows it (N = 100).
    const symbol = vocab.caseNames.get(t.raw);
    if (t.kind === 'word' && symbol && !(valueFollows(tokens, i + 1, vocab) && (t.raw.length === 1 || vocab.phrases.get(loose(t.text))?.type === 'param'))) { push('name', [symbol], i, i + 1); i++; continue; }
    let best = null;
    for (let k = Math.min(MAX_PHRASE, tokens.length - i); k >= 1 && !best; k--) {
      const span = tokens.slice(i, i + k);
      if (span.some(x => x.kind === 'num' || x.kind === 'size' || (x.kind === 'op' && k > 1))) continue;
      const entry = vocab.phrases.get(phraseKey(span)) || (span.every(x => x.kind !== 'op') ? vocab.compact.get(compactKey(span)) : null);
      if (!entry) continue;
      if (entry.needsValue && !valueFollows(tokens, i + k, vocab) && !afterExtreme()) { if (vocab.stops.has(phraseKey(span))) best = {entry: {type: 'stop', value: null}, k}; continue; }
      best = {entry, k};
    }
    if (!best && t.kind === 'word' && t.text.length >= 5 && !vocab.phrases.has(loose(t.text))) {
      const word = loose(t.text), limit = word.length >= 8 ? 2 : 1;
      let found = null, distance = limit + 1;
      for (const [key, entry] of vocab.single) { const d = editDistance(word, key, limit); if (d < distance) { distance = d; found = entry; } }
      if (found) best = {entry: found, k: 1, corrected: true};
    }
    if (best) { push(best.entry.type, best.entry.value, i, i + best.k, {...(best.corrected ? {corrected: true} : {}), ...(best.entry.word ? {word: true} : {}), ...(best.entry.needsParam ? {needsParam: true} : {})}); i += best.k; continue; }
    push(t.kind === 'op' ? 'stop' : 'word', null, i, i + 1); i++;
  }
  return tags;
}

// The label strings of the learned tagger: one per token, "type:value" or "O".
export function labelOf(tag) {
  if (!tag || tag.type === 'word') return 'O';
  if (['num', 'size'].includes(tag.type)) return tag.type;
  if (tag.type === 'name') return 'name';
  if (tag.type === 'stop') return 'stop';
  // Parameters by the base of their key: J₂/J₁ is j2, U/t and U/J are u.
  if (tag.type === 'param') return `param:${String(tag.value).split('/')[0]}`;
  return `${tag.type}:${tag.value}`;
}
export {FAMILY_ALIASES, PART_ALIASES, BOUNDARY_ALIASES, CATEGORY_ALIASES, PARAM_ALIASES, FILLING_ALIASES, OP_ALIASES, STOP, ELEMENTS, NAME_ALIASES};
export function tagFromLabel(label) {
  if (!label || label === 'O') return null;
  const at = label.indexOf(':'), type = at < 0 ? label : label.slice(0, at), value = at < 0 ? null : label.slice(at + 1);
  return {type, value: type === 'dim' ? Number(value) : value};
}

export function tagQuery(query, vocab, tagger = null) {
  const tokens = splitGlued(tokenize(query), vocab);
  let tags = ruleTags(tokens, vocab);
  // A learned tagger labels the words the vocabulary does not know; known words keep their rule tags.
  if (tagger) {
    const labels = tagger(tokens);
    if (labels && labels.length === tokens.length) {
      const merged = [];
      for (const tag of tags) {
        if (tag.type !== 'word') { merged.push(tag); continue; }
        const learned = tagFromLabel(labels[tag.from]);
        if (!learned || learned.type === 'num' || learned.type === 'size') { merged.push(tag); continue; }
        const value = learned.type === 'name' ? vocab.nameParts.filter(p => wordsOf(p).has(loose(tokens[tag.from].text))) : learned.value;
        if (learned.type === 'name' && !value.length) { merged.push(tag); continue; }
        const previous = merged[merged.length - 1];
        // Neighbouring words with the same learned label form one span ("frustrated magnet" -> one model).
        if (previous?.learned && previous.type === learned.type && previous.type !== 'name' && String(previous.value) === String(value) && previous.to === tag.from) {
          previous.to = tag.to; previous.end = tag.end; previous.text += ' ' + tag.text; continue;
        }
        merged.push({...tag, type: learned.type, value, learned: true});
      }
      tags = merged;
    }
  }
  return {tokens, tags};
}

// ---------------------------------------------------------------------------------------------------------------
// Resolution: tags to filters. A filter keeps the character spans it came from, so its chip can remove them.
const PREFIX_OPS = new Set(['eq', 'gt', 'ge', 'lt', 'le', 'approx', 'between', 'from']);
function comparison(tags, i, accept) {
  let j = i, op = 'eq';
  while (j < tags.length && tags[j].type === 'op' && PREFIX_OPS.has(tags[j].value)) { if (tags[j].value !== 'eq') op = tags[j].value; j++; }
  if (j >= tags.length || !accept(tags[j])) return null;
  const values = [tags[j]]; j++;
  if (op === 'between' || op === 'from') {
    if (tags[j]?.type === 'op' && tags[j].value === 'join' && tags[j + 1] && accept(tags[j + 1])) { values.push(tags[j + 1]); j += 2; op = 'range'; }
    else op = op === 'from' ? 'ge' : 'eq';
  } else if (op === 'eq' && tags[j]?.type === 'op' && tags[j].value === 'join' && tags[j].text !== 'and' && tags[j + 1] && accept(tags[j + 1])) { values.push(tags[j + 1]); j += 2; op = 'range'; }
  else if (op === 'eq') {
    while (tags[j]?.type === 'op' && (tags[j].value === 'list' || tags[j].text === 'and') && tags[j + 1] && accept(tags[j + 1]) && tags[j + 1].type === values[0].type) { values.push(tags[j + 1]); j += 2; }
    if (values.length > 1) op = 'list';
  }
  return {op, values: values.map(v => v.type === 'size' ? {dims: v.value, text: v.value.join(' × ')} : {...v.value}), from: i, end: j, start: tags[i].start, stop: tags[j - 1].end};
}
const PARTICLE_WORDS = new Set(['electron', 'particle', 'fermion', 'boson', 'hard-core boson', 'spinless fermion', 'conduction electron']), SITE_WORDS = new Set(['site', 'spin', 'qubit']);

export function resolve(tags) {
  const filters = [], words = [], consumed = new Set();
  const span = tag => [tag.start, tag.end];
  const numeric = (kind, c, spans, extra = {}) => filters.push({kind, op: c.op, values: c.values, spans: [...spans, [c.start, c.stop]], ...extra});
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    if (consumed.has(i)) continue;
    if (['family', 'part', 'boundary', 'category', 'dim'].includes(t.type)) { filters.push({kind: t.type, value: t.value, spans: [span(t)], corrected: t.corrected, learned: t.learned, text: t.text}); continue; }
    if (t.type === 'name') {
      const parts = new Set(t.value), spans = [span(t)], texts = [t.text];
      let exact = !t.word;
      while (tags[i + 1]?.type === 'name') { i++; spans.push(span(tags[i])); texts.push(tags[i].text); tags[i].value.forEach(p => parts.add(p)); exact = false; }
      // A system's own name or formula selects it ("N2" is N₂ only); consecutive name words narrow to the systems
      // whose names contain all of them ("uracil dimer stacked").
      filters.push({kind: 'name', words: exact ? [] : texts, parts: texts.length === 1 ? [...parts] : [], spans, learned: t.learned, text: texts.join(' ')});
      continue;
    }
    if (t.type === 'extreme') {
      // What it ranges over: a parameter right after it, past filler ("largest U", "lowest value of the doping"), or the size.
      let j = i + 1;
      while (j < i + 4 && (tags[j]?.type === 'stop' || (tags[j]?.type === 'op' && tags[j].value === 'eq'))) j++;
      const target = tags[j]?.type === 'param' ? tags[j] : null;
      // Without one it is not a filter, nor a word to look for in descriptions: "lowest energy" asks for every result.
      if (t.needsParam && !target) { words.push({...t, unused: true}); continue; }
      // A parameter that has its own value ("largest U above 4") stays a filter of its own.
      const own = target && !comparison(tags, j + 1, x => x.type === 'num' || x.type === 'size');
      if (own) consumed.add(j);
      filters.push({kind: 'extreme', dir: t.value, name: target && !['sites', 'n'].includes(target.value) ? target.value : null,
        spans: [[t.start, own ? target.end : t.end]], learned: t.learned, text: own ? `${t.text} ${target.text}` : t.text});
      continue;
    }
    if (t.type === 'filling') {
      if (t.value === 'doped') { const c = comparison(tags, i + 1, x => x.type === 'num'); if (c) { numeric('param', c, [span(t)], {name: 'doping', text: t.text}); i = c.end - 1; continue; } }
      filters.push({kind: 'filling', value: t.value, spans: [span(t)], learned: t.learned, text: t.text}); continue;
    }
    if (t.type === 'param') {
      const c = comparison(tags, i + 1, x => x.type === 'num' || (['l', 'n', 'sites'].includes(t.value) && x.type === 'size'));
      if (c) { numeric('param', c, [span(t)], {name: t.value, text: t.text, learned: t.learned}); i = c.end - 1; }
      else if (!SPECIAL_PARAMS.has(t.value)) filters.push({kind: 'has', name: t.value, spans: [span(t)], learned: t.learned, text: t.text});
      continue;
    }
    if (t.type === 'num' || t.type === 'size' || (t.type === 'op' && PREFIX_OPS.has(t.value))) {
      const c = comparison(tags, i, x => x.type === 'num' || x.type === 'size');
      if (!c) continue;
      let after = c.end; while (tags[after]?.type === 'stop' && after < c.end + 2) after++;
      const next = tags[after], nextWord = next && loose(normalize(next.text));
      // A number before a unit or a parameter that has no value of its own: "100 sites", "56 electrons", "1/8 doping", "0.5 J2".
      if (next && c.values[0].value !== undefined && (SITE_WORDS.has(nextWord) || PARTICLE_WORDS.has(nextWord) || (next.type === 'category' && /boson|fermion/.test(nextWord)))) {
        numeric('param', c, [span(next)], {name: SITE_WORDS.has(nextWord) ? 'sites' : 'particles', text: next.text});
        // "13 spinless fermions", "64 bosons": the particles also say which class of system.
        if (next.type === 'category') filters.push({kind: 'category', value: next.value, spans: [span(next)], text: next.text});
        i = after; continue;
      }
      if (next && c.values[0].value !== undefined && (next.type === 'param' || (next.type === 'filling' && next.value === 'doped')) && !comparison(tags, after + 1, x => x.type === 'num')) {
        numeric('param', c, [span(next)], {name: next.type === 'filling' ? 'doping' : next.value, text: next.text}); i = after; continue;
      }
      if (c.values[0].dims) numeric('size', c, []);
      else numeric('any', c, []);
      i = c.end - 1; continue;
    }
    if (t.type === 'word') words.push(t);
  }
  // A generic model next to a more specific one names the specific one: "Heisenberg J1-J2" is J₁–J₂ Heisenberg.
  const families = filters.filter(f => f.kind === 'family');
  for (const f of families) {
    const own = wordsOf(f.value);
    if (families.some(g => g !== f && g.value !== f.value && [...own].every(w => wordsOf(g.value).has(w)))) {
      const target = families.find(g => g !== f && [...own].every(w => wordsOf(g.value).has(w)));
      target.spans.push(...f.spans); filters.splice(filters.indexOf(f), 1);
    }
  }
  return {filters, words};
}

// ---------------------------------------------------------------------------------------------------------------
// Matching.
function close(x, q, approxFacet) {
  if (q.decimals === null || q.decimals === undefined) return Math.abs(x - q.value) <= 1e-9 * Math.max(1, Math.abs(q.value));
  // A value the instance gives only approximately (U/t = 10^(5/9) ≈ 3.59381) matches a decimal query that rounds to it
  // (3.59, 3.6), but not an integer (U = 8 is not 10^(8/9) ≈ 7.74).
  if (approxFacet && q.decimals > 0 && Math.abs(x - q.value) <= 0.5 * 10 ** -q.decimals + 1e-12) return true;
  return Math.abs(x - q.value) <= 1e-9 * Math.max(1, Math.abs(q.value));
}
function satisfies(x, f, approxFacet = false) {
  if (x === null || x === undefined || Number.isNaN(x)) return false;
  const v = f.values, eps = 1e-9 * Math.max(1, Math.abs(v[0].value));
  switch (f.op) {
    case 'eq': case 'list': return v.some(q => close(x, q, approxFacet));
    case 'approx': return v.some(q => Math.abs(x - q.value) <= Math.max(0.1 * Math.abs(q.value), 0.5 * 10 ** -(q.decimals ?? 3)));
    case 'gt': return x > v[0].value + eps;
    case 'ge': return x >= v[0].value - eps;
    case 'lt': return x < v[0].value - eps;
    case 'le': return x <= v[0].value + eps;
    case 'range': { const lo = Math.min(v[0].value, v[1].value), hi = Math.max(v[0].value, v[1].value); return x >= lo - eps && x <= hi + eps; }
    default: return false;
  }
}
// Sizes: "10x10" is a cluster of that shape (either orientation); "> 10x10" compares numbers of sites.
function sizeMatches(f, filter) {
  if (filter.op === 'eq' || filter.op === 'list') {
    return Boolean(f.dims) && filter.values.some(q => q.dims.length === f.dims.length && (q.dims.every((d, k) => d === f.dims[k]) || q.dims.every((d, k) => d === f.dims[f.dims.length - 1 - k])));
  }
  const product = q => ({value: q.dims.reduce((a, b) => a * b, 1), decimals: 0});
  return satisfies(f.sites, {...filter, values: filter.values.map(product)});
}
function paramValues(f, name) {
  switch (name) {
    case 'sites': return [{value: f.sites}];
    case 'particles': return f.particles ? [{value: f.particles.total}] : [];
    case 'n': return [{value: f.sites}, ...(f.particles ? [{value: f.particles.total}] : []), ...f.params.filter(p => p.key === 'n')];
    case 'nup': return f.particles?.up !== null && f.particles?.up !== undefined ? [{value: f.particles.up}] : [];
    case 'ndown': return f.particles?.down !== null && f.particles?.down !== undefined ? [{value: f.particles.down}] : [];
    case 'sz': return f.sz === null ? [] : [{value: f.sz}];
    case 'doping': return f.doping === null ? [] : [{value: f.doping}];
    case 'l': return f.dims ? [{value: Math.max(...f.dims), square: f.dims.every(d => d === f.dims[0])}] : [];
    default: return f.params.filter(p => p.key === name || p.base === name);
  }
}
export function matches(f, filter) {
  switch (filter.kind) {
    case 'family': return f.family === filter.value || (filter.related || []).includes(f.family);
    case 'part': return f.part === filter.value || (!f.lattice && f.words.has(loose(normalize(filter.value))));
    case 'boundary': return f.boundary === filter.value;
    case 'category': return f.category === filter.value;
    case 'dim': return f.dimension === filter.value;
    case 'name': {
      if (f.lattice) return false;
      const words = filter.words.flatMap(w => tokenize(w).filter(t => t.kind === 'word').map(t => loose(t.text)));
      return filter.parts.includes(f.part) || (words.length > 0 && words.every(w => f.nameWords.has(w)));
    }
    case 'filling':
      return {half: Math.abs((f.filling ?? -1) - 0.5) < 1e-9, unit: Math.abs((f.density ?? -1) - 1) < 1e-9, doped: (f.doping ?? 0) > 1e-9,
        polarized: f.polarized === true, unpolarized: f.polarized === false}[filter.value] ?? false;
    case 'param': {
      // The special case of a model has the vanishing coupling at zero (the Heisenberg model has J₂ = 0).
      if (filter.zeroFor?.includes(f.family) && !paramValues(f, filter.name).length) return satisfies(0, filter);
      if (filter.name === 'l' && (filter.op === 'eq' || filter.op === 'list')) return Boolean(f.dims) && f.dims.every(d => d === f.dims[0]) && filter.values.some(q => q.dims ? sizeMatches(f, filter) : q.value === f.dims[0]);
      if (filter.values[0].dims) return sizeMatches(f, filter);
      return paramValues(f, filter.name).some(p => satisfies(p.value, filter, p.approx));
    }
    case 'has': return f.params.some(p => (p.key === filter.name || p.base === filter.name) && !p.unit);
    case 'size': return sizeMatches(f, filter);
    case 'any': {
      const values = [f.sites, ...(f.particles ? [f.particles.total] : []), ...(f.dims && f.dims.every(d => d === f.dims[0]) ? [f.dims[0]] : [])].map(value => ({value}));
      return [...values, ...f.params.filter(p => !p.unit)].some(p => satisfies(p.value, filter, p.approx));
    }
    case 'text': return f.words.has(filter.word) || (filter.word.length >= 4 && f.wordList.some(w => w.startsWith(filter.word)));
    default: return true;
  }
}
// Filters of one kind (and, for parameters, one name) are alternatives; different kinds must all hold.
export function applyFilters(facets, filters) {
  const groups = new Map();
  for (const f of filters) { const key = f.kind === 'param' || f.kind === 'has' ? `${f.kind}:${f.name}` : f.kind === 'filling' ? `filling:${f.value}` : f.kind === 'name' || f.kind === 'text' || f.kind === 'any' ? `${f.kind}:${groups.size}` : f.kind; (groups.get(key) || groups.set(key, []).get(key)).push(f); }
  return facets.filter(f => [...groups.values()].every(group => group.some(filter => matches(f, filter))));
}
function distance(f, filter) {
  if (filter.kind === 'size' || filter.values?.[0]?.dims) {
    const target = filter.values[0].dims.reduce((a, b) => a * b, 1);
    return Math.abs(f.sites - target) / target;
  }
  const candidates = filter.kind === 'any' ? [f.sites, ...f.params.filter(p => !p.unit).map(p => p.value)] : paramValues(f, filter.name).map(p => p.value);
  const bound = filter.values[0].value, scale = Math.max(Math.abs(bound), 1e-3);
  return Math.min(Infinity, ...candidates.filter(Number.isFinite).map(x => satisfies(x, filter) ? 0 : Math.abs(x - bound) / scale));
}
// The value a superlative ranks: the number of sites (particles for systems in continuous space), or a parameter.
function extremeValue(f, filter) {
  if (!filter.name) return f.lattice ? f.sites : f.particles?.total ?? f.sites;
  const values = paramValues(f, filter.name).map(p => p.value).filter(Number.isFinite);
  return values.length ? (filter.dir === 'max' ? Math.max(...values) : Math.min(...values)) : NaN;
}

// ---------------------------------------------------------------------------------------------------------------
export function buildIndex(benchmarks, categories = {}) {
  const facets = benchmarks.map(facetsOf), vocab = buildVocabulary(benchmarks, facets), paramLabels = new Map();
  for (const f of facets) for (const p of f.params) { if (!paramLabels.has(p.key)) paramLabels.set(p.key, p.label); if (!paramLabels.has(p.base)) paramLabels.set(p.base, p.label); }
  return {facets, vocab, categories, paramLabels, families: [...new Set(benchmarks.map(b => b.family))]};
}

export function searchInstances(query, index, {tagger = null} = {}) {
  const {tokens, tags} = tagQuery(query, index.vocab, tagger), {filters, words} = resolve(tags);
  let pool = applyFilters(index.facets, filters);
  // Words that are not in the vocabulary narrow the search when some instance contains them; otherwise they are
  // shown as unused rather than emptying the result.
  const ignored = [];
  for (const w of words) {
    if (w.unused) { ignored.push(w); continue; }
    const word = loose(normalize(w.text)), filter = {kind: 'text', word, spans: [[w.start, w.end]], text: w.text};
    const kept = pool.filter(f => matches(f, filter));
    if (kept.length && (filters.length || kept.length < index.facets.length)) { filters.push(filter); pool = kept; } else ignored.push(w);
  }
  const understood = filters.length > 0, notes = [];
  let results = understood ? pool : [], nearest = [];
  if (understood && !results.length) {
    // Related models first: "Heisenberg" with J2 = 0.5 means the J₁–J₂ Heisenberg model.
    const related = filters.filter(f => f.kind === 'family').map(f => ({...f, related: index.families.filter(name => name !== f.value && [...wordsOf(f.value)].every(w => wordsOf(name).has(w)))}));
    if (related.some(f => f.related.length)) {
      const widened = filters.map(f => related.find(r => r.spans === f.spans) || f), found = applyFilters(index.facets, widened);
      if (found.length) { results = found; notes.push({kind: 'related', families: [...new Set(found.map(f => f.family))]}); }
    }
    // Then the model a named one reduces to: on Ketboard, J₁–J₂ on the kagome lattice is the Heisenberg model (J₂ = 0).
    const special = filters.filter(f => f.kind === 'family' && index.families.includes(SPECIAL_CASES[f.value]?.family));
    if (!results.length && special.length) {
      const cases = special.map(f => ({from: f.value, ...SPECIAL_CASES[f.value]}));
      const widened = filters.map(f => special.includes(f) ? {...f, related: [...(f.related || []), SPECIAL_CASES[f.value].family]}
        : f.kind === 'param' && cases.some(c => c.param === f.name) ? {...f, zeroFor: cases.filter(c => c.param === f.name).map(c => c.family)} : f);
      const found = applyFilters(index.facets, widened);
      if (found.length) { results = found; notes.push({kind: 'special', cases}); }
    }
    if (!results.length) {
      const NUMERIC = new Set(['param', 'size', 'any']), others = filters.filter(f => !NUMERIC.has(f.kind)), strict = filters.filter(f => NUMERIC.has(f.kind));
      if (strict.length) {
        nearest = applyFilters(index.facets, others).map(f => ({f, d: strict.reduce((sum, filter) => sum + distance(f, filter), 0)}))
          .filter(x => Number.isFinite(x.d)).sort((a, b) => a.d - b.d);
        // The closest tier only: values within three times the best distance (0.5 and 0.55 for 0.52, not 0.2).
        nearest = nearest.filter(x => x.d <= 3 * nearest[0].d + 1e-9).slice(0, 12).map(x => x.f);
        if (nearest.length) notes.push({kind: 'nearest', filters: strict});
      }
      if (!nearest.length) {
        // No number to relax, or none close: drop one filter at a time, the least defining first, and say which one.
        const order = ['text', 'boundary', 'size', 'filling', 'dim', 'has', 'part', 'name', 'category', 'family'];
        for (const kind of order) {
          const dropped = filters.filter(f => f.kind === kind);
          if (!dropped.length) continue;
          const found = applyFilters(index.facets, filters.filter(f => f.kind !== kind));
          if (found.length) { nearest = found; notes.push({kind: 'dropped', filters: dropped}); break; }
        }
      }
    }
  }
  // Superlatives last, on the instances shown: the largest or smallest size, or the extreme value of a parameter.
  // Every instance at that value stays (all Sᶻ sectors and boundaries of the largest cluster).
  for (const filter of filters.filter(f => f.kind === 'extreme')) {
    const scored = (results.length ? results : nearest).map(f => ({f, x: extremeValue(f, filter)})).filter(s => Number.isFinite(s.x));
    if (!scored.length) continue;
    const best = (filter.dir === 'max' ? Math.max : Math.min)(...scored.map(s => s.x));
    const kept = scored.filter(s => Math.abs(s.x - best) <= 1e-9 * Math.max(1, Math.abs(best))).map(s => s.f);
    filter.found = {value: best, unit: filter.name ? null : kept[0].lattice ? 'sites' : kept[0].particles?.kind || 'particles'};
    if (results.length) results = kept; else nearest = kept;
  }
  return {query, tokens, tags, filters, ignored, results, nearest, notes, understood};
}

// The query without the parts a removed chip came from.
export function removeSpans(query, spans) {
  const sorted = [...spans].sort((a, b) => b[0] - a[0]);
  let out = query;
  for (const [start, end] of sorted) out = out.slice(0, start) + ' ' + out.slice(end);
  return out.replace(/\s+/g, ' ').replace(/^[\s=<>≤≥:,]+|[\s=<>≤≥:,]+$/g, '').trim();
}

const OP_TEXT = {eq: '=', gt: '>', ge: '≥', lt: '<', le: '≤', approx: '≈'};
const SPECIAL_LABELS = {l: 'L', n: 'N', sites: 'Sites', particles: 'Particles', nup: 'N↑', ndown: 'N↓', sz: 'Sᶻ', doping: 'Doping', s: 'S'};
function valueText(f) {
  const show = q => q.text ?? String(q.value);
  if (f.op === 'range') return `between ${show(f.values[0])} and ${show(f.values[1])}`;
  if (f.op === 'list') return `= ${f.values.map(show).join(' or ')}`;
  return `${OP_TEXT[f.op] || '='} ${show(f.values[0])}`;
}
export function describeFilter(f, index) {
  const label = name => SPECIAL_LABELS[name] || index.paramLabels.get(name) || name;
  switch (f.kind) {
    case 'family': return `Model: ${f.value}${f.corrected ? ` (read “${f.text}” as ${f.value})` : ''}`;
    case 'part': return `Lattice: ${f.value.toLowerCase()}${f.corrected ? ` (read “${f.text}” as ${f.value.toLowerCase()})` : ''}`;
    case 'boundary': return `Boundaries: ${f.value.toLowerCase()}${f.corrected ? ` (read “${f.text}” as ${f.value.toLowerCase()})` : ''}`;
    case 'category': return `Class: ${index.categories?.[f.value] || f.value}`;
    case 'dim': return `${f.value}D`;
    case 'name': return `System: ${f.text}`;
    case 'filling': return {half: 'Half filling', unit: 'Unit filling', doped: 'Doped', polarized: 'Fully polarized', unpolarized: 'Unpolarized'}[f.value];
    case 'param': return `${label(f.name)} ${valueText(f)}`;
    case 'has': return `Has ${label(f.name)}`;
    case 'size': return f.op === 'eq' || f.op === 'list' ? `Size ${f.values.map(q => q.text).join(' or ')}` : `Sites ${OP_TEXT[f.op] || ''} ${f.values[0].text}`.replace(/\s+/g, ' ');
    case 'any': return `Any parameter or size ${valueText(f)}`;
    case 'text': return `Contains “${f.text}”`;
    case 'extreme': {
      const found = f.found ? `: ${f.found.value}${f.found.unit ? ` ${f.found.unit}` : ''}` : '';
      if (!f.name) return `${f.dir === 'max' ? 'Largest' : 'Smallest'} size${found}`;
      const sizeLike = ['l', 'particles', 'nup', 'ndown'].includes(f.name);
      return `${f.dir === 'max' ? (sizeLike ? 'Largest' : 'Highest') : (sizeLike ? 'Smallest' : 'Lowest')} ${label(f.name)}${found}`;
    }
    default: return f.kind;
  }
}

export const EXAMPLES = ['J1-J2 square lattice J2 = 0.5', 'Hubbard 16x16 1/8 doping', 'jellium rs = 10', 'largest kagome Heisenberg', 'N2 bond length 2.068', 'TFIM chain h = 1'];
