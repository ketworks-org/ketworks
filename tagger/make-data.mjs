// Training data for the learned search tagger: queries in words about Ketboard instances, one label per token, in
// the label space of site/search.mjs (labelOf). Each query describes a real instance from data/benchmarks.json with
// a few of its facets (model, lattice, boundaries, size, couplings, filling, system name), written with the
// vocabulary's aliases or with the paraphrases below, in random order, with filler words.
//
// Two sets of paraphrases: TRAIN ones go into train.jsonl and dev.jsonl; HELD_OUT ones only into heldout.jsonl,
// which measures whether the tagger reads words it never saw in training. Neither set is in the rule vocabulary,
// so on these words the rule tagger alone says nothing.
//
//   node tagger/make-data.mjs [out-dir] [train-size]
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {buildIndex, tokenize, ruleTags, labelOf, FAMILY_ALIASES, PART_ALIASES, BOUNDARY_ALIASES, CATEGORY_ALIASES, PARAM_ALIASES, FILLING_ALIASES, NAME_ALIASES, ELEMENTS} from '../site/search.mjs';

const out = process.argv[2] || 'tagger/data', trainSize = Number(process.argv[3] || 40000);
const benchmarks = JSON.parse(readFileSync(new URL('../data/benchmarks.json', import.meta.url), 'utf8'));
const index = buildIndex(benchmarks), vocab = index.vocab;

// A seeded generator, so the data are the same on every run.
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let random = rng(20261109);
const pick = list => list[Math.floor(random() * list.length)], chance = p => random() < p;
const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Paraphrases outside the rule vocabulary. Keys are labels; each phrase is labeled as a whole.
const TRAIN = {
  'family:J₁–J₂ Heisenberg': ['frustrated antiferromagnet', 'frustrated magnet', 'competing interactions model', 'j1 j2 antiferromagnet', 'next-nearest-neighbour heisenberg', 'frustrated spin-1/2 magnet', 'j1-j2 antiferromagnet', 'second-neighbour heisenberg'],
  'family:Heisenberg': ['nearest-neighbour antiferromagnet', 'unfrustrated antiferromagnet', 'isotropic exchange model', 'heisenberg afm', 'nn heisenberg', 'su(2) spin model'],
  'family:Transverse-field Ising': ['ising in a transverse field', 'transverse ising chain', 'quantum ising magnet', 'tfim model'],
  'family:Hubbard': ['hubbard-type model', 'repulsive hubbard', 'one-band hubbard', 'single-band hubbard'],
  'family:t–t′ Hubbard': ['hubbard with next-nearest hopping', 'tt prime hubbard', 'extended-hopping hubbard'],
  'family:t–V': ['spinless t-v', 'interacting spinless fermions', 'spinless fermions with repulsion'],
  'family:Bose–Hubbard': ['bosonic hubbard model', 'interacting lattice bosons', 'superfluid-mott model'],
  'family:Electron gas': ['jellium model', 'electron gas in a box', 'uniform electron liquid', 'homogeneous electron liquid', 'coulomb gas'],
  'family:2D quantum dot': ['harmonically trapped electrons', 'electrons in a harmonic trap', 'parabolic dot', '2d dot'],
  'family:Atoms and molecules': ['molecular systems', 'small molecules', 'isolated atoms', 'chemistry benchmarks'],
  'family:Solids': ['crystalline materials', 'bulk solids', 'periodic crystals'],
  'family:Shastry–Sutherland': ['shastry sutherland lattice model', 'dimer-singlet model', 'orthogonal-dimer magnet'],
  'family:Holstein': ['holstein polaron', 'electron phonon chain', 'phonon-coupled electrons'],
  'family:Kondo–Heisenberg': ['kondo lattice model', 'kondo-heisenberg lattice', 'heavy-fermion model'],
  'family:Z₂ lattice gauge theory': ['z2 gauge model', 'ising lattice gauge theory', 'z2 gauge field with matter'],
  'family:SU(2) lattice gauge theory': ['su2 lattice gauge', 'non-abelian lattice gauge', 'su(2) yang-mills lattice'],
  'part:Square': ['square-lattice', 'square grid', 'quadratic lattice', 'square cluster'],
  'part:Triangular': ['triangle lattice', 'triangular grid', 'trigonal lattice'],
  'part:Honeycomb': ['hexagonal lattice', 'graphene lattice', 'honeycomb grid'],
  'part:Kagome': ['kagome net', 'corner-sharing triangles', 'trihexagonal lattice'],
  'part:Pyrochlore': ['corner-sharing tetrahedra', 'pyrochlore net'],
  'part:Chain': ['1d chain', 'spin chain', 'linear chain', 'one-dimensional chain', 'ring'],
  'boundary:Periodic': ['periodic boundaries', 'torus geometry', 'wrapped around', 'periodically closed', 'pbcs'],
  'boundary:Open': ['open edges', 'free edges', 'open-boundary', 'no periodicity'],
  'boundary:Cylinder': ['cylindrical geometry', 'cylinder strip', 'periodic in one direction'],
  'boundary:Periodic × antiperiodic': ['antiperiodic in y', 'mixed periodic antiperiodic', 'twisted boundaries'],
  'boundary:Free space': ['in vacuum', 'open space', 'isolated molecule'],
  'category:lattice-spins': ['quantum spin models', 'spin lattice models', 'magnetic models'],
  'category:lattice-fermions': ['fermionic lattice models', 'lattice electron models', 'strongly correlated electrons'],
  'category:lattice-bosons': ['bosonic lattice models', 'lattice boson models'],
  'category:continuum-electrons': ['ab initio systems', 'electronic structure problems', 'continuum systems'],
  'filling:half': ['one electron per site', 'half-filled band', 'at half-filling', 'undoped system'],
  'filling:doped': ['hole doped', 'away from half-filling', 'finite hole density'],
  'filling:unit': ['one boson per site', 'unit density'],
  'filling:polarized': ['spin-polarized gas', 'fully spin polarized', 'ferromagnetic gas'],
  'filling:unpolarized': ['spin-unpolarized gas', 'paramagnetic gas'],
};
const TRAIN_PARAMS = {
  j2: ['frustration strength', 'diagonal exchange', 'second-neighbour coupling', 'j2 coupling', 'nnn exchange', 'next-nearest exchange'],
  u: ['hubbard interaction', 'interaction u', 'coupling u', 'on-site u', 'repulsion u', 'local repulsion'],
  "t'": ['next-nearest hopping', 'diagonal hopping amplitude', "t prime", 'second-neighbour hopping'],
  h: ['field h', 'transverse magnetic field', 'field value', 'transverse field strength'],
  v: ['nearest-neighbour interaction v', 'repulsion v', 'interaction v'],
  rs: ['density rs', 'rs parameter', 'wigner seitz rs', 'r_s value'],
  omega: ['trap strength', 'trapping frequency', 'harmonic frequency'],
  r: ['bond distance', 'nuclear separation', 'internuclear separation', 'bond length r'],
  doping: ['hole doping level', 'doping fraction', 'hole fraction'],
  sites: ['number of spins', 'lattice sites', 'site count'],
  particles: ['electron number', 'number of fermions', 'particle number'],
};
// Never in training: the held-out test of words the tagger has not seen.
const HELD_OUT = {
  'family:J₁–J₂ Heisenberg': ['frustrated spin model', 'competing exchange model', 'frustrated quantum magnet'],
  'family:Heisenberg': ['plain antiferromagnet', 'isotropic antiferromagnet'],
  'family:Transverse-field Ising': ['quantum ising chain', 'ising model in a field'],
  'family:Electron gas': ['free electron gas', 'electron fluid', 'jellium gas'],
  'family:2D quantum dot': ['artificial atom', 'parabolic confinement'],
  'family:Hubbard': ['fermi hubbard lattice', 'hubbard lattice model'],
  'family:Bose–Hubbard': ['bosonic hubbard lattice'],
  'part:Honeycomb': ['hexagon lattice', 'graphene-like lattice'],
  'part:Triangular': ['triangular net'],
  'part:Kagome': ['kagome network'],
  'boundary:Periodic': ['toroidal', 'periodic edges'],
  'boundary:Open': ['hard edges', 'open sides'],
  'boundary:Cylinder': ['cylindrical strip', 'tube geometry'],
  'filling:half': ['one fermion per site', 'commensurate filling'],
  'filling:doped': ['hole-rich', 'with holes'],
};
const HELD_OUT_PARAMS = {
  j2: ['diagonal coupling strength', 'frustrating coupling'], u: ['hubbard repulsion', 'onsite coulomb'], h: ['transverse coupling'],
  rs: ['wigner-seitz parameter'], r: ['bond separation'], doping: ['hole density'],
};

// Ways the vocabulary already writes each label (parameters by canonical base name).
const known = {};
const addKnown = (label, phrase) => (known[label] ||= new Set()).add(phrase);
for (const [family, list] of Object.entries(FAMILY_ALIASES)) [family, ...list].forEach(p => addKnown(`family:${family}`, p));
for (const [part, list] of Object.entries(PART_ALIASES)) [part.toLowerCase(), ...list].forEach(p => addKnown(`part:${part}`, p));
for (const [value, list] of Object.entries(BOUNDARY_ALIASES)) list.forEach(p => addKnown(`boundary:${value}`, p));
for (const [value, list] of Object.entries(CATEGORY_ALIASES)) list.forEach(p => addKnown(`category:${value}`, p));
for (const [value, list] of Object.entries(FILLING_ALIASES)) list.forEach(p => addKnown(`filling:${value}`, p));
const knownParams = {};
for (const [name, list] of Object.entries(PARAM_ALIASES)) knownParams[name] = list;
for (const f of index.facets) for (const p of f.params) (knownParams[p.base] ||= []).includes(p.label) || knownParams[p.base].push(p.label);

const FILLER_START = ['', '', '', 'show me', 'find', 'the', 'all', 'instances of the', 'list the', 'benchmarks for the', 'energies for', 'which instances of the', 'results on the', 'i want the', 'look for'];
const FILLER_JOIN = ['', '', '', 'on the', 'on a', 'with', 'at', 'for', 'and', 'in', 'of', ','];
const NOISE = ['stripe', 'phase', 'critical', 'famous', 'lowest energy', 'best', 'recent', 'ground state', 'neural network', 'transformer', 'rbm', 'vmc', 'dmrg', 'comparison', 'accuracy', '2023', 'paper', 'deconfined', 'spin liquid', 'quantum critical point', 'convergence'];
const OPS = [['=', 6], [' = ', 4], [':', 1], [' of ', 1], [' at ', 1], [' is ', 1], [' ', 3], [' equal to ', 0.5], [' ~ ', 0.5], [' around ', 0.5], [' > ', 0.4], [' above ', 0.3], [' >= ', 0.3], [' at least ', 0.3], [' < ', 0.3], [' below ', 0.3]];
const weighted = list => { let r = random() * list.reduce((s, [, w]) => s + w, 0); for (const [x, w] of list) { r -= w; if (r <= 0) return x; } return list[0][0]; };
const formatValue = v => {
  if (Number.isInteger(v)) return String(v);
  const fractions = {0.5: '1/2', 0.25: '1/4', 0.125: '1/8', 0.2: '1/5'};
  if (fractions[Math.abs(v)] && chance(0.25)) return (v < 0 ? '-' : '') + fractions[Math.abs(v)];
  const s = String(+v.toFixed(6));
  return chance(0.15) && s.startsWith('0.') ? s.slice(1) : s.replace('-', chance(0.2) ? '−' : '-');
};

// A fragment is text with a label for its words, or null for filler (labeled by the rule tagger).
function labelFragment(text, label) {
  const tokens = tokenize(text);
  if (!tokens.length) return [];
  const rule = ruleTags(tokens, vocab), labels = [];
  for (const tag of rule) for (let k = tag.from; k < tag.to; k++) labels.push(label && !['num', 'size', 'op'].includes(tag.type) ? label : labelOf(tag));
  // Words the rule tagger does not know: what the learned tagger is for.
  const unknown = [];
  for (const tag of rule) for (let k = tag.from; k < tag.to; k++) unknown.push(tag.type === 'word');
  return tokens.map((t, k) => ({text: t.text, label: labels[k], unknown: unknown[k]}));
}
function phraseFor(label, mode) {
  const train = TRAIN[label] || [], held = HELD_OUT[label] || [], rule = [...(known[label] || [])];
  if (mode === 'heldout' && held.length && chance(0.8)) return pick(held);
  if (train.length && chance(0.5)) return pick(train);
  return rule.length ? pick(rule) : null;
}
function paramName(name, mode) {
  if (mode === 'heldout' && HELD_OUT_PARAMS[name] && chance(0.8)) return pick(HELD_OUT_PARAMS[name]);
  if (TRAIN_PARAMS[name] && chance(0.45)) return pick(TRAIN_PARAMS[name]);
  return pick(knownParams[name] || [name]);
}

function sample(mode) {
  const f = pick(index.facets), b = f.benchmark, parts = [];
  const add = (label, text) => { if (text) parts.push([[text, label]]); };
  if (chance(0.8)) add(`family:${b.family}`, phraseFor(`family:${b.family}`, mode));
  if (f.lattice && chance(0.6)) parts.push([[phraseFor(`part:${b.part}`, mode), `part:${b.part}`], ...(chance(0.3) ? [['lattice', null]] : [])]);
  if (!f.lattice && !/^\dD$/.test(b.part) && chance(0.9)) {
    const element = Object.entries(ELEMENTS).find(([, symbol]) => symbol === b.part)?.[0], alias = Object.entries(NAME_ALIASES).find(([, list]) => list.includes(b.part))?.[0];
    add('name', pick([b.part, b.part, element, alias].filter(Boolean)));
  }
  if (chance(0.35)) add(`boundary:${f.boundary}`, phraseFor(`boundary:${f.boundary}`, mode));
  if (chance(0.1)) add(`category:${b.category}`, phraseFor(`category:${b.category}`, mode));
  if (f.dimension && chance(0.12)) add(`dim:${f.dimension}`, pick([`${f.dimension}d`, `${f.dimension}D`, ['', 'one-dimensional', 'two-dimensional', 'three-dimensional'][f.dimension]]));
  if (f.dims && chance(0.4)) parts.push([[pick([f.dims.join('x'), f.dims.join(' x '), f.dims.join('×'), f.dims.join(' by ')]), 'size']]);
  else if (f.lattice && chance(0.15)) parts.push([[String(f.sites), null], [pick(['sites', 'spins', 'site']), 'param:sites']]);
  for (const p of f.params) {
    if (p.unit || !chance(0.5)) continue;
    const op = weighted(OPS), name = paramName(p.base, mode), value = formatValue(p.value);
    parts.push(chance(0.85) ? [[name, `param:${p.base}`], [op, null], [value, null]] : [[value, null], [' ', null], [name, `param:${p.base}`]]);
  }
  if (f.doping && chance(0.4)) parts.push(chance(0.5) ? [[formatValue(f.doping), null], [paramName('doping', mode), 'param:doping']] : [[paramName('doping', mode), 'param:doping'], [pick([' ', ' = ', ' of ']), null], [formatValue(f.doping), null]]);
  if (f.filling === 0.5 && chance(0.3)) add('filling:half', phraseFor('filling:half', mode));
  if (f.doping > 0 && chance(0.15)) add('filling:doped', phraseFor('filling:doped', mode));
  if (f.polarized === true && chance(0.3)) add('filling:polarized', phraseFor('filling:polarized', mode));
  if (f.particles && !f.lattice && chance(0.25)) parts.push([[String(f.particles.total), null], [pick(['electrons', 'electron', 'particles']), 'param:particles']]);
  if (chance(0.25)) parts.push([[pick(NOISE), null]]);
  if (!parts.length) add(`family:${b.family}`, phraseFor(`family:${b.family}`, mode));
  // Order: mostly as a person writes (model first), sometimes shuffled.
  const ordered = chance(0.6) ? parts : shuffle(parts), tokens = [];
  const push = (text, label) => tokens.push(...labelFragment(text, label));
  push(pick(FILLER_START), null);
  ordered.forEach((fragments, i) => { if (i) push(pick(FILLER_JOIN), null); for (const [text, label] of fragments) push(text, label); });
  // A few typos in content words, so that the tagger does not depend on exact spelling.
  for (const t of tokens) if (t.label !== 'stop' && t.label !== 'O' && /^[a-z]{6,}$/.test(t.text) && chance(0.03)) { const k = 1 + Math.floor(random() * (t.text.length - 2)); t.text = t.text.slice(0, k) + t.text[k + 1] + t.text[k] + t.text.slice(k + 2); }
  return {tokens: tokens.map(t => t.text), labels: tokens.map(t => t.label), unknown: tokens.map(t => t.unknown), instance: b.id};
}

mkdirSync(out, {recursive: true});
const write = (file, rows) => writeFileSync(`${out}/${file}`, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
const train = Array.from({length: trainSize}, () => sample('train'));
random = rng(7); const dev = Array.from({length: 3000}, () => sample('train'));
random = rng(11); const heldout = Array.from({length: 3000}, () => sample('heldout'));
const labels = [...new Set([...train, ...dev, ...heldout].flatMap(r => r.labels))].sort();
// Words that only the held-out paraphrases use: neither in a training paraphrase nor in the rule vocabulary.
const wordsIn = phrases => new Set(phrases.flatMap(p => tokenize(p).map(t => t.text)));
const trainWords = wordsIn([...Object.values(TRAIN).flat(), ...Object.values(TRAIN_PARAMS).flat()]);
const heldWords = [...wordsIn([...Object.values(HELD_OUT).flat(), ...Object.values(HELD_OUT_PARAMS).flat()])].filter(w => !trainWords.has(w) && !train.some(r => r.tokens.includes(w)));
writeFileSync(`${out}/heldout-words.json`, JSON.stringify(heldWords.sort()) + '\n');
write('train.jsonl', train); write('dev.jsonl', dev); write('heldout.jsonl', heldout);
writeFileSync(`${out}/labels.json`, JSON.stringify(labels, null, 1) + '\n');
const unknownShare = rows => rows.flatMap(r => r.unknown).filter(Boolean).length / rows.flatMap(r => r.unknown).length;
console.log(`${train.length} train, ${dev.length} dev, ${heldout.length} held-out queries; ${labels.length} labels; words unknown to the rules: train ${(100 * unknownShare(train)).toFixed(1)}%, held-out ${(100 * unknownShare(heldout)).toFixed(1)}%`);
for (const r of heldout.slice(0, 6)) console.log('  ' + r.tokens.map((t, k) => r.unknown[k] ? `[${t}→${r.labels[k]}]` : t).join(' '));
