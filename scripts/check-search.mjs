// Ketboard search (site/search.mjs): every instance is readable as facets, and queries in words find the instances
// a reader means. Runs in `npm test` against the current data/benchmarks.json.
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {buildIndex, searchInstances, describeFilter, removeSpans, tokenize, parametersOf, EXAMPLES} from '../site/search.mjs';
import {orderInstances} from '../site/leaderboard.mjs';
import {createTagger, encode} from '../site/search-tagger.mjs';

const benchmarks = orderInstances(JSON.parse(readFileSync(new URL('../data/benchmarks.json', import.meta.url), 'utf8')));
const categories = {'lattice-spins': 'Lattice spins', 'lattice-fermions': 'Lattice fermions', 'lattice-bosons': 'Lattice bosons', 'continuum-electrons': 'Continuum electrons'};
const index = buildIndex(benchmarks, categories);
const byId = new Map(index.facets.map(f => [f.id, f]));
const param = (f, base) => f.params.find(p => p.base === base)?.value;
let tagger = null;
const search = query => searchInstances(query, index, {tagger});
const ids = query => search(query).results.map(f => f.id);
const chips = query => { const r = search(query); return r.filters.map(f => describeFilter(f, index)); };

// Facets: no coupling of an instance is lost, and the values agree with the instance keys.
for (const b of benchmarks) {
  if (b.category === 'continuum-electrons') continue;
  const items = b.parameters_latex.split(/,?\s*\\qquad\s*/).filter(Boolean);
  assert.equal(parametersOf(b.parameters_latex).length, items.length, `${b.id}: every coupling in parameters_latex is read (${b.parameters_latex})`);
  const f = byId.get(b.id);
  const key = (name, pattern) => { const m = pattern.exec(b.id); return m ? Number(m[1].replace('p', '.')) : undefined; };
  const j2 = key('j2', /-j2-(\d+(?:p\d+)?)-/), u = key('u', /-u(\d+(?:p\d+)?)-/);
  if (j2 !== undefined) assert.ok(Math.abs(param(f, 'j2') - j2) < 1e-9, `${b.id}: J2/J1 read as ${param(f, 'j2')}`);
  if (u !== undefined && b.family !== 'Bose–Hubbard') assert.ok(Math.abs(param(f, 'u') - u) < 1e-3, `${b.id}: U/t read as ${param(f, 'u')}`);
  const m = /^(\d+) × (\d+) ·/.exec(b.lattice_size);
  if (m && !/cells/.test(b.lattice_size)) assert.equal(f.dims[0] * f.dims[1], b.sites, `${b.id}: ${b.lattice_size}`);
  assert.ok(f.dimension, `${b.id}: dimension of the ${b.part} lattice`);
}
for (const f of index.facets) if (f.particles?.up !== null && f.particles?.up !== undefined) assert.equal(f.particles.up + f.particles.down, f.particles.total);
assert.deepEqual(parametersOf('t=1,\\qquad U/t=10^{5/9}\\approx 3.59381,\\qquad t^{\\prime}=0').map(p => [p.key, p.value, p.approx]), [['t', 1, false], ['u/t', 3.59381, true], ["t'", 0, false]]);
assert.deepEqual(parametersOf('J_1=1,\\qquad J_2/J_1=0.5,\\qquad S=\\tfrac12').map(p => [p.label, p.value]), [['J₁', 1], ['J₂/J₁', 0.5], ['S', 0.5]]);

// Tokens: sizes, signed numbers, ranges, fractions and the query positions of each token.
assert.deepEqual(tokenize('J₂/J₁=0.5 on 10×10').map(t => [t.kind, t.text]), [['word', 'j2/j1'], ['op', '='], ['num', '0.5'], ['word', 'on'], ['size', '10x10']]);
assert.deepEqual(tokenize("t′=-0.2, U 0.4-0.6").map(t => t.text), ["t'", '=', '-0.2', ',', 'u', '0.4', '-', '0.6']);
assert.equal(tokenize('1/8 doping')[0].value.value, 0.125);
assert.deepEqual(tokenize('Kagomé (open)').map(t => [t.text, t.raw]), [['kagome', 'Kagomé'], ['open', 'open']]);

// Queries, run with the rules alone and again with the learned tagger: the tagger only reads words the rules do not
// know, so every one of these must hold either way.
function queryChecks() {
// The question that started this: J1-J2 on the square lattice at J2 = 0.5.
const main = search('the j1-j2 instances on the square lattice at j2=0.5');
assert.deepEqual(main.filters.map(f => describeFilter(f, index)), ['Model: J₁–J₂ Heisenberg', 'Lattice: square', 'J₂/J₁ = 0.5']);
const expected = index.facets.filter(f => f.family === 'J₁–J₂ Heisenberg' && f.part === 'Square' && param(f, 'j2') === 0.5).map(f => f.id);
assert.ok(expected.length >= 10);
assert.deepEqual(main.results.map(f => f.id), expected);
assert.deepEqual(main.ignored, []);
for (const q of ['J1J2 square J2 = 0.5', 'J₁–J₂ Heisenberg square lattice J₂/J₁ = 0.5', 'square j1 j2 model with j2/j1 0.5', 'frustrated square magnet j2 0.5', 'j1-j2 square j2=.5'])
  assert.deepEqual(ids(q), expected, q);

// Each kind of filter.
const all = (query, test) => { const r = ids(query); assert.ok(r.length > 0, `${query}: no result`); r.forEach(id => assert.ok(test(byId.get(id)), `${query}: ${id}`)); return r; };
all('J1-J2 model on 10x10 with open boundaries', f => f.family === 'J₁–J₂ Heisenberg' && f.dims.join() === '10,10' && f.boundary === 'Open');
all('Hubbard 16x16 1/8 doping', f => f.family === 'Hubbard' && f.dims.join() === '16,16' && Math.abs(f.doping - 0.125) < 1e-9);
all('hubbard u=8 half filling 8x8', f => f.family === 'Hubbard' && param(f, 'u') === 8 && f.filling === 0.5 && f.sites === 64);
all('j2 between 0.4 and 0.6 6x6', f => param(f, 'j2') >= 0.4 && param(f, 'j2') <= 0.6 && f.sites === 36);
assert.equal(ids('j2 between 0.4 and 0.6 6x6').length, ids('j2 0.4-0.6 6x6').length);
all('heisenberg square more than 200 sites', f => f.family === 'Heisenberg' && f.sites > 200);
all('jellium rs = 10', f => f.family === 'Electron gas' && param(f, 'rs') === 10);
all('heg 3d rs 1 54 electrons', f => f.dimension === 3 && param(f, 'rs') === 1 && f.particles.total === 54);
all('2d electron gas', f => f.family === 'Electron gas' && f.dimension === 2);
all('fully polarized jellium N=27', f => f.particles.down === 0 && f.particles.total === 27);
all('N2 bond length 2.068', f => f.part === 'N₂' && param(f, 'r') === 2.068);
all('TFIM chain h = 1', f => f.family === 'Transverse-field Ising' && f.part === 'Chain' && param(f, 'h') === 1);
all("t' = -0.2", f => param(f, "t'") === -0.2);
all('u8 4x4', f => param(f, 'u') === 8 && f.sites === 16);
all('L=10 open j1j2', f => f.dims.every(d => d === 10) && f.boundary === 'Open');
all('13 spinless fermions', f => f.family === 't–V' && f.particles.total === 13);
all('quantum dot omega 0.28 N=12', f => param(f, 'omega') === 0.28 && f.particles.total === 12);
all('Hubbard model at U/t = 3.59', f => Math.abs(param(f, 'u') - 3.59381) < 1e-9);
all('6x6 or 8x8 j1j2 j2 = 0.5', f => [36, 64].includes(f.sites) && param(f, 'j2') === 0.5);
all('hubbard u=4 or u=8 8x8', f => [4, 8].includes(param(f, 'u')) && f.sites === 64);
all('carbon atom', f => f.part === 'C');
all('Ne', f => f.part === 'Ne');
all('graphene', f => f.part === 'Graphene');
all('uracil dimer stacked', f => f.part === 'Uracil dimer (stacked)');
all('cylinder hubbard', f => f.boundary === 'Cylinder' && f.family === 'Hubbard');
all('bose hubbard unit filling', f => f.family === 'Bose–Hubbard' && f.density === 1);
all('pyroclore', f => f.part === 'Pyrochlore');
all('kagme heisenberg', f => f.part === 'Kagome');
all('S22', f => f.words.has('s22'));
all('spin-1/2 heisenberg chain', f => f.family === 'Heisenberg' && f.part === 'Chain');
assert.match(chips('pyroclore')[0], /read “pyroclore” as pyrochlore/);
assert.deepEqual(ids('N2').every(id => byId.get(id).part === 'N₂'), true, 'N2 is the molecule, not every name that contains N₂');

// Words the vocabulary does not know narrow the result only when an instance contains them.
const stripe = search('stripe hubbard');
assert.deepEqual(stripe.ignored.map(w => w.text), ['stripe']);
assert.ok(stripe.results.every(f => f.family === 'Hubbard') && stripe.results.length > 10);
assert.deepEqual(search('the instances').filters, []);
assert.deepEqual(search('').results, []);

// No exact match: related models, then the closest values, then a dropped filter, each said in a note.
const related = search('heisenberg j2=0.5');
assert.equal(related.notes[0].kind, 'related');
assert.ok(related.results.every(f => param(f, 'j2') === 0.5));
const nearest = search('j1-j2 square j2=0.52');
assert.deepEqual(nearest.results, []);
assert.equal(nearest.notes[0].kind, 'nearest');
assert.ok([0.5, 0.55].includes(param(nearest.nearest[0], 'j2')));
const dropped = search('kagome heisenberg open');
assert.equal(dropped.notes[0].kind, 'dropped');
assert.ok(dropped.nearest.every(f => f.part === 'Kagome'));
// A model with no match falls back to its special case: J₁–J₂ on the kagome lattice is the kagome Heisenberg model.
const kagome = index.facets.filter(f => f.family === 'Heisenberg' && f.part === 'Kagome');
assert.ok(!index.facets.some(f => f.family === 'J₁–J₂ Heisenberg' && f.part === 'Kagome'), 'kagome J1-J2 instances exist; pick another special-case check');
const special = search('kagome j1-j2');
assert.equal(special.notes[0].kind, 'special');
assert.deepEqual(special.results.map(f => f.id), kagome.map(f => f.id));
assert.deepEqual(ids('kagome j1-j2 j2 = 0'), kagome.map(f => f.id), 'the special case has J2 = 0');
assert.equal(search('kagome j1-j2 j2 = 0.5').notes.some(n => n.kind === 'special'), false, 'but not J2 = 0.5');

// Superlatives: the largest or smallest size, or the extreme value of a parameter, among the instances found.
const sitesOf = list => list.map(f => f.sites);
const largestKagome = Math.max(...sitesOf(kagome)), smallestKagome = Math.min(...sitesOf(kagome));
for (const q of ['kagome j1-j2 largest size', 'largest kagome heisenberg', 'biggest kagome heisenberg system', 'kagome heisenberg with the most sites', 'kagome heisenberg largest L']) {
  const r = search(q);
  assert.deepEqual(r.ignored, [], q);
  assert.ok(r.results.length > 0 && r.results.every(f => f.part === 'Kagome' && f.sites === largestKagome), `${q}: ${r.results.map(f => f.id)}`);
}
assert.deepEqual(chips('kagome j1-j2 largest size'), ['Lattice: kagome', 'Model: J₁–J₂ Heisenberg', `Largest size: ${largestKagome} sites`]);
assert.equal(removeSpans('kagome j1-j2 largest size', search('kagome j1-j2 largest size').filters[2].spans), 'kagome j1-j2');
all('smallest kagome heisenberg', f => f.part === 'Kagome' && f.sites === smallestKagome);
const hubbard = index.facets.filter(f => f.family === 'Hubbard' && f.dims?.join() === '8,8');
const maxU = Math.max(...hubbard.map(f => param(f, 'u')).filter(Number.isFinite));
all('hubbard 8x8 largest U', f => f.family === 'Hubbard' && param(f, 'u') === maxU && f.sites === 64);
all('hubbard 8x8 highest value of u', f => param(f, 'u') === maxU && f.sites === 64);
all('lowest doping hubbard 16x16', f => f.doping === Math.min(...index.facets.filter(g => g.family === 'Hubbard' && g.dims?.join() === '16,16' && g.doping !== null).map(g => g.doping)));
all('largest u above 4 hubbard 8x8', f => param(f, 'u') === maxU);
const lowestEnergy = search('lowest energy heisenberg');
assert.deepEqual(lowestEnergy.filters.map(f => f.kind), ['family'], '"lowest energy" is not a superlative, nor text to look for');
assert.deepEqual(lowestEnergy.ignored.map(w => w.text), ['lowest']);
assert.equal(lowestEnergy.results.length, index.facets.filter(f => f.family === 'Heisenberg').length);
assert.ok(!search('the most frustrated magnet').filters.some(f => f.kind === 'extreme'), '"most" needs a parameter');

// Removing a chip removes its words from the query.
assert.equal(removeSpans(main.query, main.filters[2].spans), 'the j1-j2 instances on the square lattice at');
const q = 'Hubbard 16x16 1/8 doping';
assert.equal(removeSpans(q, search(q).filters[1].spans), 'Hubbard 1/8 doping');
assert.equal(removeSpans(q, search(q).filters[2].spans), 'Hubbard 16x16');

// The examples shown under the search box all find something.
for (const example of EXAMPLES) assert.ok(ids(example).length > 0, example);

}
queryChecks();
console.log(`search: ${index.facets.length} instances indexed, ${index.vocab.phrases.size} phrases; rule checks pass`);

// The learned tagger (site/search-model, from tagger/train.py): the browser code computes the logits of the NumPy
// reference, the query checks still hold, and on words the rules do not know it finds what was meant.
const model = new URL('../site/search-model/', import.meta.url);
if (existsSync(new URL('tagger.bin', model))) {
  const bin = readFileSync(new URL('tagger.bin', model)), vocabText = readFileSync(new URL('vocab.txt', model), 'utf8');
  tagger = createTagger(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), vocabText);
  const vocab = new Map(vocabText.split('\n').filter(Boolean).map((piece, id) => [piece, id]));
  let worst = 0;
  for (const v of JSON.parse(readFileSync(new URL('test-vectors.json', model), 'utf8'))) {
    assert.deepEqual(encode(v.tokens, vocab, 64).ids, v.pieces, `WordPiece of ${v.tokens.join(' ')}`);
    const got = tagger.logits(v.tokens).logits;
    v.logits.forEach((row, k) => row && row.forEach((x, j) => { worst = Math.max(worst, Math.abs(x - got[k][j])); }));
  }
  assert.ok(worst < 2e-3, `browser logits differ from the reference by ${worst}`);
  queryChecks();
  // Words the rules do not know (none of them in the tagger's training paraphrases either, except where noted).
  const has = (query, test) => searchInstances(query, index, {tagger}).filters.some(test);
  const cases = [
    ['frustrated spin model on the square lattice at j2 0.5', f => f.kind === 'family' && f.value === 'J₁–J₂ Heisenberg'],
    ['frustrated quantum magnet 8x8', f => f.kind === 'family' && f.value === 'J₁–J₂ Heisenberg'],
    ['hexagon lattice heisenberg', f => f.kind === 'part' && f.value === 'Honeycomb'],
    ['toroidal j1-j2 10x10', f => f.kind === 'boundary' && f.value === 'Periodic'],
    ['heisenberg 16x16 with hard edges', f => f.kind === 'boundary' && f.value === 'Open'],
    ['electron fluid rs 5', f => f.kind === 'family' && f.value === 'Electron gas'],
    ['artificial atom with 6 electrons', f => f.kind === 'family' && f.value === '2D quantum dot'],
    ['hubbard 8x8 one fermion per site', f => f.kind === 'filling' && f.value === 'half'],
    ['hubbard repulsion 4 on 8x8', f => f.kind === 'param' && f.name === 'u'],
    ['diagonal coupling strength 0.55 on 6x6', f => f.kind === 'param' && f.name === 'j2'],
    ['hubbard in a tube geometry', f => f.kind === 'boundary' && f.value === 'Cylinder'],
    ['free electron gas at rs 10', f => f.kind === 'family' && f.value === 'Electron gas'],
  ];
  const rules = cases.filter(([q, test]) => searchInstances(q, index).filters.some(test)).length;
  const learned = cases.filter(([q, test]) => has(q, test));
  console.log(`tagger: browser logits within ${worst.toExponential(1)} of the reference; unfamiliar-word queries understood: rules ${rules}/${cases.length}, rules + tagger ${learned.length}/${cases.length}`);
  for (const [q, test] of cases) if (!has(q, test)) console.log(`  missed: ${q}`);
  assert.ok(learned.length > rules, 'the tagger reads words the rules miss');
  // Words that mean nothing on Ketboard stay unused rather than becoming filters.
  for (const q of ['stripe hubbard', 'largest j1j2 cluster', 'best transformer results heisenberg']) {
    const r = searchInstances(q, index, {tagger});
    assert.ok(!r.filters.some(f => f.learned), `${q}: ${r.filters.filter(f => f.learned).map(f => describeFilter(f, index))}`);
  }
}
