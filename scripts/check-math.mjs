import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderMarkdown, renderArticle} from './render-content.mjs';
const inline = renderMarkdown('A state $|\\Psi_\\theta\\rangle$ and energy.');
assert.match(inline, /katex-mathml/);
assert.match(inline, /annotation encoding="application\/x-tex"/);
assert.doesNotMatch(inline, /katex-display/);
assert.match(renderMarkdown('$$\nE=\\frac{\\langle\\Psi|H|\\Psi\\rangle}{\\langle\\Psi|\\Psi\\rangle}\n$$'), /katex-display/);
assert.throws(() => renderMarkdown('$\\notARealCommand$'));
assert.match(renderMarkdown('<script>alert(1)</script>'), /&lt;script&gt;/);
assert.doesNotMatch(renderMarkdown('[bad](javascript:alert(1))'), /href="javascript:/);
const linked = renderMarkdown('See Carleo and Troyer, arXiv:1606.02318 (2016), Sandvik, arXiv:cond-mat/9707123, and v3 of arXiv:2302.01941v3; not in `arXiv:0000.0000` nor [arXiv:1111.1111](https://example.org).');
assert.match(linked, /<a href="https:\/\/arxiv.org\/abs\/1606.02318" class="arxiv">arXiv:1606.02318<\/a> \(2016\)/);
assert.match(linked, /href="https:\/\/arxiv.org\/abs\/cond-mat\/9707123"/);
assert.match(linked, /href="https:\/\/arxiv.org\/abs\/2302.01941v3"/);
assert.match(linked, /<code>arXiv:0000.0000<\/code>/);
assert.equal((linked.match(/example.org/g) || []).length, 1);
assert.doesNotMatch(linked, /arxiv.org\/abs\/1111.1111/);
const anchors = renderArticle('# T\n\n## The local energy\n\n## The local energy\n\n### Sub $x$\n');
assert.deepEqual(anchors.headings.map(h=>h.id), ['the-local-energy','the-local-energy-2','sub-x']);
const mathHeading = renderArticle('# T\n\n## Why $J_2/J_1=0.5$\n\n## Known energies for $10\\times10$\n');
assert.deepEqual(mathHeading.headings.map(h=>h.text), ['Why J2/J1=0.5', 'Known energies for 10×10']);
assert.match(anchors.html, /<h2 id="the-local-energy">/);
for (const page of JSON.parse(fs.readFileSync('wiki/index.json','utf8'))) {
  const article = renderArticle(fs.readFileSync(`wiki/${page.slug}.md`,'utf8'));
  assert.match(article.html, /katex/);
  assert.match(article.html, /<h1>/);
  assert.ok(article.headings.length >= 2, `${page.slug} needs section headings for its table of contents`);
}
console.log('KaTeX inline/display rendering, malformed LaTeX rejection, Markdown safety, and all wiki articles pass.');
const {makeSubmission, mergeSubmission, parseToken, instanceFromForm, makeProposal}=await import('../site/submission.mjs');
assert.deepEqual(parseToken('-0.497634(1)'), {token:'-0.497634(1)', energy:'-0.497634', uncertainty:'0.000001'});
assert.deepEqual(parseToken('−199.05174'), {token:'-199.05174', energy:'-199.05174', uncertainty:null});
assert.deepEqual(parseToken('-50.000(20)'), {token:'-50.000(20)', energy:'-50.000', uncertainty:'0.020'});
assert.deepEqual(parseToken('-47.745(12)'), {token:'-47.745(12)', energy:'-47.745', uncertainty:'0.012'});
assert.deepEqual(parseToken('-0.4976921(4)').uncertainty, '0.0000004');
assert.throws(()=>parseToken('-0.49(1'));
const benchmark=JSON.parse(fs.readFileSync('data/benchmarks.json','utf8'))[0];
const fields={paper_id:'2601.00001v1',benchmark_id:benchmark.id,title:'',authors:'',method:'Test NQS',variant:'Test',method_class:'rbm',energy_token:'-50.000(20)',normalization:'total',uncertainty_type:'standard_error',source_location:'Synthetic Table 1',eligibility_evidence:'Synthetic test only',parameter_count:'400',notes:''};
const submission=makeSubmission(fields,benchmark);
assert.equal(submission.source_sha256,null);
assert.equal(submission.extraction_model,'human');
assert.equal(submission.paper.title,'', 'title may be left for the metadata workflow');
assert.equal(submission.results[0].energy,'-50.000');
assert.equal(submission.results[0].uncertainty,'0.020');
assert.equal(submission.results[0].parameter_count,400);
assert.equal(submission.results[0].method_class,'rbm');
assert.throws(()=>makeSubmission({...fields,energy_token:'-50.000'},benchmark), /error bar/, 'an entry without an error bar is refused');
assert.equal(makeSubmission({...fields,energy_token:'-50.000',uncertainty_value:'± 0.020'},benchmark).results[0].uncertainty,'0.020');
assert.throws(()=>makeSubmission({...fields,uncertainty_value:'0.5'},benchmark), /disagrees/);
assert.throws(()=>makeSubmission({...fields,uncertainty_type:'not_reported'},benchmark));
assert.equal(submission.results[0].variance,null,'the variance is optional');
assert.equal(makeSubmission({...fields,variance:'1.25'},benchmark).results[0].variance,'1.25');
assert.throws(()=>makeSubmission({...fields,variance:'-1'},benchmark), /variance/);
assert.throws(()=>makeSubmission({...fields,paper_id:'2601.00001'},benchmark));
assert.throws(()=>makeSubmission({...fields,method_class:'RBM'},benchmark));
assert.throws(()=>makeSubmission({...fields,parameter_count:'many'},benchmark));
const existing={schema_version:1,paper:{id:'2601.00001v1',title:'Stored',authors:'A',published:'2026-01-01T00:00:00Z',updated:'2026-01-01T00:00:00Z'},source_url:'https://arxiv.org/pdf/2601.00001v1',source_sha256:'0'.repeat(64),extraction_model:'human',results:[{...submission.results[0],variant:'Other'}],issues:[]};
const merged=mergeSubmission(existing,submission);
assert.equal(merged.results.length,2); assert.equal(merged.paper.title,'Stored'); assert.equal(merged.source_sha256,'0'.repeat(64));
assert.throws(()=>mergeSubmission(existing,makeSubmission({...fields,variant:'Other'},benchmark)), /already recorded/);
assert.throws(()=>mergeSubmission({...existing,paper:{...existing.paper,id:'2601.00001v2'}},submission), /newer/);
const upgraded=mergeSubmission(existing,makeSubmission({...fields,paper_id:'2601.00001v2'},benchmark));
assert.equal(upgraded.paper.id,'2601.00001v2'); assert.equal(upgraded.source_sha256,null);
// Generated instance keys must reproduce the existing ones, so conventions stay uniform.
const registry=JSON.parse(fs.readFileSync('data/benchmarks.json','utf8'));
const generated=[
  ['j1j2-square-10x10-pbc-j2-0p5-sz0', {model:'j1j2',lattice:'square',lx:'10',ly:'10',boundaries:'pbc',j2:'0.5',sz:'0'}],
  ['heisenberg-triangular-6x6-pbc-sz0', {model:'heisenberg',lattice:'triangular',lx:'6',ly:'6',boundaries:'pbc'}],
  ['hubbard-square-8x8-pbc-u8-n56-sz0', {model:'hubbard',lattice:'square',lx:'8',ly:'8',boundaries:'pbc',u:'8',nup:'28',ndown:'28'}],
  ['hubbard-rectangular-16x4-pbc-u8-n56-sz0', {model:'hubbard',lattice:'rectangular',lx:'16',ly:'4',boundaries:'pbc',u:'8',nup:'28',ndown:'28'}],
];
for (const [id, form] of generated) {
  const entry = instanceFromForm(form);
  assert.equal(entry.id, id);
  const stored = registry.find(b => b.id === id);
  if (stored) { assert.equal(entry.sites, stored.sites); assert.equal(entry.unit, stored.unit); assert.equal(entry.hamiltonian_latex, stored.hamiltonian_latex); assert.equal(entry.name, stored.name); assert.equal(entry.category, stored.category); }
  for (const key of ['id','name','family','category','geometry','hamiltonian','sector','unit','instance_label','lattice_size','boundary_conditions']) assert.ok(entry[key], `${id}: ${key} must not be empty`);
  assert.throws(() => instanceFromForm(form, [id]), /already exists/);
}
assert.equal(instanceFromForm({model:'tfim',lattice:'square',lx:'12',ly:'12',boundaries:'pbc',h:'3.05'}).id, 'tfim-square-12x12-pbc-h3p05');
assert.equal(instanceFromForm({model:'heisenberg',lattice:'honeycomb',lx:'6',ly:'6',boundaries:'cyl',sz:'0'}).sites, 72);
assert.equal(instanceFromForm({model:'heisenberg',lattice:'chain',lx:'32',boundaries:'pbc'}).id, 'heisenberg-chain-32-pbc-sz0');
// Labels give the size as the lattice is drawn (8 × 8, L = 32, 6 × 6 cells); the site count belongs to the size field.
assert.equal(instanceFromForm({model:'heisenberg',lattice:'chain',lx:'32',boundaries:'pbc'}).instance_label, 'L = 32 · J = 1 · periodic · Sz = 0');
assert.equal(instanceFromForm({model:'heisenberg',lattice:'honeycomb',lx:'6',ly:'6',boundaries:'cyl',sz:'0'}).instance_label.split(' · ')[0], '6 × 6 cells');
for (const b of registry) assert.ok(!/\bsites?\b/.test(b.instance_label), `${b.id}: the label should not count sites`);
assert.throws(() => instanceFromForm({model:'j1j2',lattice:'square',lx:'10',ly:'8',boundaries:'pbc',j2:'0.5'}), /equal extents/);
assert.throws(() => instanceFromForm({model:'hubbard',lattice:'square',lx:'4',ly:'4',boundaries:'pbc',u:'8',nup:'20',ndown:'2'}), /electrons/);
const custom = instanceFromForm({model:'custom',lattice:'square',lx:'6',ly:'6',boundaries:'pbc',system_name:'Kagome Heisenberg',hamiltonian_text:'H = ...',unit:'J',category:'lattice-spins'});
assert.equal(custom.id, 'kagome-heisenberg-square-6x6-pbc'); assert.equal(custom.family, 'Kagome Heisenberg'); assert.equal(custom.part, 'Square'); assert.equal(custom.category, 'lattice-spins');
assert.throws(() => instanceFromForm({model:'custom',lattice:'square',lx:'6',ly:'6',boundaries:'pbc',system_name:'Kagome Heisenberg',hamiltonian_text:'H = ...',unit:'J'}), /class of system/);
const proposal = makeProposal({...fields, system_description:'Shuriken lattice Heisenberg, 24 sites, periodic, Sz = 0', unit:'J'});
assert.equal(makeProposal({...fields, system_description:'Shuriken lattice Heisenberg', unit:'J', category:'lattice-spins', category_label:'Lattice spins'}).results[0].system_description, 'Lattice spins. Shuriken lattice Heisenberg');
assert.equal(proposal.results[0].benchmark_id, null); assert.equal(proposal.results[0].unit, 'J'); assert.equal(proposal.results[0].energy, '-50.000');
assert.throws(() => makeProposal({...fields, unit:'J'}), /Describe the system/);
// Continuum electrons: every stored instance is reproduced from its structured system, and the presets give stable keys.
const {continuumInstance, continuumInstanceFromForm, continuumFormValues} = await import('../site/continuum.mjs');
for (const b of registry.filter(b => b.category === 'continuum-electrons')) assert.deepEqual(continuumInstance(b.system), b, `${b.id}: stored instance differs from its generated form`);
// "Add an instance like this one" fills the form with values that rebuild the instance: exactly for continuum
// instances, by key and model for template-built lattice instances; every model has a starting point or is proposed.
const {newInstanceValues} = await import('../site/submission.mjs');
for (const b of registry.filter(b => b.category === 'continuum-electrons')) { const v = continuumFormValues(b.system); assert.equal(v.category, 'continuum-electrons'); assert.deepEqual(continuumInstanceFromForm(v), b, `${b.id}: form values do not rebuild it`); }
for (const b of registry.filter(b => !b.system)) { const v = newInstanceValues(b); if (v) { const r = instanceFromForm(v); assert.equal(r.id, b.id); assert.equal(r.family, b.family); assert.equal(v.category, b.category); } }
// Models are named by their Hamiltonian and navigated by part (lattice, dimension, molecule, material); the
// parts that no template rebuilds are started as proposals.
const templated = new Set(registry.filter(b => b.system || newInstanceValues(b)).map(b => `${b.family} / ${b.part}`));
assert.deepEqual([...new Set(registry.map(b => `${b.family} / ${b.part}`))].filter(f => !templated.has(f)).sort(), ['Heisenberg / Kagome', 'Heisenberg / Pyrochlore', 'Holstein / Chain', 'Kondo–Heisenberg / Square', 'SU(2) lattice gauge theory / Square', 'Shastry–Sutherland / Square', 'Z₂ lattice gauge theory / Square', 't–V / Square']);
assert.deepEqual([...new Set(registry.filter(b => b.category.startsWith('lattice')).map(b => b.family))].sort(), ['Bose–Hubbard', 'Heisenberg', 'Holstein', 'Hubbard', 'J₁–J₂ Heisenberg', 'Kondo–Heisenberg', 'SU(2) lattice gauge theory', 'Shastry–Sutherland', 'Transverse-field Ising', 'Z₂ lattice gauge theory', 't–V', 't–t′ Hubbard']);
assert.ok(registry.every(b => typeof b.part === 'string' && b.part));
const triangular = instanceFromForm({model:'heisenberg',lattice:'triangular',lx:'6',ly:'6',boundaries:'pbc',sz:'0',category:'lattice-spins'});
assert.equal(triangular.family, 'Heisenberg'); assert.equal(triangular.part, 'Triangular');
assert.equal(instanceFromForm({model:'hubbard',lattice:'rectangular',lx:'16',ly:'4',boundaries:'pbc',u:'8',nup:'28',ndown:'28',category:'lattice-fermions'}).part, 'Square');
// Bose–Hubbard: fixed N, the occupation cutoff (if any) in the key, and the round trip from a stored instance.
const bh = instanceFromForm({model:'bosehubbard',lattice:'square',lx:'8',ly:'8',boundaries:'pbc',ub:'16.8',nb:'64',category:'lattice-bosons'});
assert.equal(bh.id, 'bosehubbard-square-8x8-pbc-u16p8-n64'); assert.equal(bh.family, 'Bose–Hubbard'); assert.equal(bh.part, 'Square'); assert.equal(bh.category, 'lattice-bosons'); assert.equal(bh.unit, 'J');
assert.equal(instanceFromForm({model:'bosehubbard',lattice:'square',lx:'8',ly:'8',boundaries:'pbc',ub:'16.8',nb:'64',nmax:'4'}).id, 'bosehubbard-square-8x8-pbc-u16p8-n64-nmax4');
assert.throws(() => instanceFromForm({model:'bosehubbard',lattice:'square',lx:'2',ly:'2',boundaries:'pbc',ub:'1',nb:'9',nmax:'2'}), /cutoff/);
assert.throws(() => instanceFromForm({model:'bosehubbard',lattice:'square',lx:'2',ly:'2',boundaries:'pbc',ub:'1'}), /number of bosons/);
assert.deepEqual(newInstanceValues(registry.find(b => b.id === 'bosehubbard-square-20x20-pbc-u16p8-n400')), {category:'lattice-bosons',instance_mode:'new',lattice:'square',lx:'20',ly:'20',boundaries:'pbc',model:'bosehubbard',ub:'16.8',nb:'400',nmax:''});
assert.equal(newInstanceValues(registry.find(b => b.id === 'hubbard-square-16x16-pa-u8-n214-sz0')), null);
assert.deepEqual(newInstanceValues(registry.find(b => b.id === 'hubbard-square-8x8-pbc-u8-tp-0p2-n56-sz0')), {category:'lattice-fermions',instance_mode:'new',lattice:'square',lx:'8',ly:'8',boundaries:'pbc',model:'ttphubbard',u:'8',tp:'-0.2',nup:'28',ndown:'28'});
assert.equal(continuumInstanceFromForm({cpreset:'heg',cdim:'3',cup:'7',cdown:'7',ccell:'sc',crs:'1',ctwist:'Gamma'}).id, 'heg3d-sc-n14-unpol-rs1');
assert.throws(() => continuumInstanceFromForm({cpreset:'heg',cdim:'3',cup:'7',cdown:'7',ccell:'sc',crs:'1'}, ['heg3d-sc-n14-unpol-rs1']), /already exists/);
const dot = continuumInstanceFromForm({cpreset:'trap',cdim:'2',cup:'3',cdown:'3',comega:'0.28'});
assert.equal(dot.id, 'trap2d-electrons-n6-unpol-w0p28'); assert.equal(dot.family, '2D quantum dot'); assert.equal(dot.per, 'system');
const n2 = continuumInstanceFromForm({cpreset:'molecule',cdim:'3',cup:'7',cdown:'7',cgeometry:'R = 2.068 bohr',cnuclei:'N 0 0 0\n7 0 0 2.068'});
assert.equal(n2.id, 'mol-n2-r-2p068-bohr-s0'); assert.equal(n2.system.external.charge, 0); assert.equal(n2.family, 'Atoms and molecules');
assert.equal(continuumInstanceFromForm({cpreset:'molecule',cdim:'3',cup:'1',cdown:'0',cgeometry:'atom',cnuclei:'He 0 0 0'}).system.external.charge, 1);
// A crystal: lattice vectors and nuclei of the simulation cell, the twist, and the energy per primitive cell or per atom.
const crystal = {cpreset:'solid',cdim:'3',cup:'2',cdown:'2',cname:'Lithium hydride',cstructure:'rock salt',cgeometry:'L = 4.0 Å',ccoord_units:'angstrom',csupercell:'1×1×1 primitive cell',cnorm:'cell',cprim:'1',clattice:'0 2 2\n2 0 2\n2 2 0',cnuclei:'Li 0 0 0\nH 2 2 2',cnuclear:'clamped'};
const lih = continuumInstanceFromForm(crystal);
assert.equal(lih.id, 'solid-lithium-hydride-rock-salt-l-4p0-a-1x1x1-primitive-cell-gamma'); assert.equal(lih.family, 'Solids'); assert.equal(lih.part, 'Lithium hydride'); assert.equal(lih.group, 'rock salt'); assert.equal(lih.per, 'cell'); assert.equal(lih.per_count, 1); assert.equal(lih.wiki, 'solids');
assert.equal(continuumInstanceFromForm({...crystal, ctwist_text:'(1/2, 0, 0)'}).id, 'solid-lithium-hydride-rock-salt-l-4p0-a-1x1x1-primitive-cell-k1o2-0-0');
assert.equal(continuumInstanceFromForm({...crystal, ctwist_text:'Γ'}).id, lih.id);
assert.throws(() => continuumInstanceFromForm({...crystal, cup:'1'}), /neutral/);
assert.throws(() => continuumInstanceFromForm({...crystal, clattice:'0 2 2\n2 0 2'}), /lattice vectors/);
assert.throws(() => continuumInstanceFromForm({...crystal, cnuclear:'quantum'}), /mass/);
const quantum = continuumInstanceFromForm({...crystal, cname:'Hydrogen', cstructure:'cubic', cup:'1', cdown:'1', cnuclei:'H 0 0 0\nH 2 2 2', cnuclear:'quantum', cmass:'1836', cnorm:'atom'});
assert.equal(quantum.system.external.type, 'quantum nuclei'); assert.equal(quantum.per_count, 2); assert.match(quantum.hamiltonian, /M = 1836/);
assert.throws(() => continuumInstanceFromForm({cpreset:'molecule',cdim:'3',cup:'1',cdown:'1',cgeometry:'R = 1.4 bohr',cnuclei:'H 0 0'}), /coordinates/);
assert.throws(() => continuumInstanceFromForm({cpreset:'molecule',cdim:'3',cup:'1',cdown:'1',cgeometry:'R = 1.4 bohr',cnuclei:'Xx 0 0 0'}), /Unknown nucleus/);
assert.throws(() => continuumInstanceFromForm({cpreset:'trap',cdim:'2',cup:'3',cdown:'3'}), /trap frequency/);
// Other particles (helium, nucleons, cold atoms) are not continuum electrons; they wait for a category of their own.
assert.throws(() => continuumInstanceFromForm({cpreset:'other',cdim:'3',cspecies:'helium-4 atoms',ccount:'64',cname:'Liquid helium-4',cspace:'periodic',ccell:'sc',csize:'L = 15.4 angstrom',cext:'none',cint:'other',cint_text:'Aziz HFDHE2',cunit:'K',cper:'particle'}), /electrons/);
assert.throws(() => continuumInstanceFromForm({cpreset:'other',cdim:'3',ccount:'4',cname:'X',cspace:'free',cext:'none',cint:'coulomb',cunit:'Ha'}), /N↑ and N↓/);
const ring = continuumInstanceFromForm({cpreset:'other',cdim:'1',cup:'2',cdown:'2',cname:'Electrons on a ring',cspace:'periodic',ccell:'other',ccell_text:'ring',csize:'L = 10 bohr',cext:'none',cint:'coulomb',cunit:'Ha',cper:'electron'});
assert.equal(ring.category, 'continuum-electrons'); assert.equal(ring.system.particles[0].name, 'electrons');
assert.throws(() => continuumInstanceFromForm({cpreset:'other',cdim:'3',cup:'2',cdown:'2',cname:'X',cspace:'free',cext:'none',cint:'other',cunit:'Ha'}), /interaction/);
console.log('Human contribution generation, new-instance keys, proposals and invalid-input checks pass.');
const {filterRows,sortRows,rankByEnergy,summarize}=await import('../site/leaderboard.mjs');
// Instances of a model are listed by size, then filling, then parameters (numbers as numbers), never in file order.
const {naturalCompare,compareInstances,orderInstances}=await import('../site/leaderboard.mjs');
assert.ok(naturalCompare('U/t = 2.15443', 'U/t = 4') < 0 && naturalCompare('U/t = 4', 'U/t = 10') < 0 && naturalCompare('U/t = −8', 'U/t = 2') < 0);
assert.ok(naturalCompare('2×2×1 cells · Γ', '2×2×1 cells · k = (1/3, 1/3, 0)') < 0 && naturalCompare('t–t′ Hubbard', 't–t′ Hubbard') === 0);
const hub=(id,sites,label)=>({id,family:'Hubbard',part:'Square',sites,instance_label:label});
const mixed=[hub('h8',64,'8 × 8 · U/t = 8 · periodic · N↑ = N↓ = 28'),hub('h4u10',16,'4 × 4 · U/t = 10 · periodic · N↑ = N↓ = 4'),{id:'tv',family:'t–V',part:'Square',sites:16,instance_label:'4 × 4 · V/t = 1 · periodic · N = 5'},hub('h8b',64,'8 × 8 · U/t = 4 · periodic · N↑ = N↓ = 25'),hub('h4n10',16,'4 × 4 · U/t = 2 · periodic · N↑ = N↓ = 5'),hub('h4u2',16,'4 × 4 · U/t = 2.15443 · periodic · N↑ = N↓ = 4')];
assert.deepEqual(orderInstances(mixed).map(b=>b.id),['h4u2','h4u10','h4n10','h8b','h8','tv']);
const ordered=orderInstances(registry);
assert.equal(ordered.length,registry.length);
assert.deepEqual([...new Set(ordered.map(b=>`${b.family} / ${b.part}`))],[...new Set(registry.map(b=>`${b.family} / ${b.part}`))]);
for (let i=1;i<ordered.length;i++) if (ordered[i].family===ordered[i-1].family&&ordered[i].part===ordered[i-1].part) assert.ok(compareInstances(ordered[i-1],ordered[i])<=0&&ordered[i-1].sites<=ordered[i].sites,`${ordered[i].id} is listed before a smaller instance`);
// Clicking an instance-table column sorts its numeric value, with absent energies last
// in both directions; ties retain the default instance order and the registry is untouched.
const {sortInstanceSummaries} = await import('../site/leaderboard.mjs');
const instanceSummary = (id, sites, label, count, energy) => ({benchmark: hub(id, sites, label), count, best: energy === null ? null : {energy_per_site: energy}});
const instanceSummaries = [
  instanceSummary('large', 100, '10 × 10 · U/t = 4', 2, '-2'),
  instanceSummary('missing', 4, '2 × 2 · U/t = 1', 0, null),
  instanceSummary('u10', 16, '4 × 4 · U/t = 10', 10, '-10'),
  instanceSummary('u2', 16, '4 × 4 · U/t = 2', 10, '-1'),
];
const summaryOrder = (key, direction) => sortInstanceSummaries(instanceSummaries, key, direction).map(s => s.benchmark.id);
assert.deepEqual(summaryOrder('sites', 'asc'), ['missing', 'u2', 'u10', 'large']);
assert.deepEqual(summaryOrder('sites', 'desc'), ['large', 'u2', 'u10', 'missing']);
assert.deepEqual(summaryOrder('instance', 'asc'), ['missing', 'u2', 'u10', 'large']);
assert.deepEqual(summaryOrder('instance', 'desc'), ['large', 'u10', 'u2', 'missing']);
assert.deepEqual(summaryOrder('results', 'asc'), ['missing', 'large', 'u2', 'u10']);
assert.deepEqual(summaryOrder('results', 'desc'), ['u2', 'u10', 'large', 'missing']);
assert.deepEqual(summaryOrder('energy', 'asc'), ['u10', 'large', 'u2', 'missing']);
assert.deepEqual(summaryOrder('energy', 'desc'), ['u2', 'large', 'u10', 'missing']);
assert.deepEqual(instanceSummaries.map(s => s.benchmark.id), ['large', 'missing', 'u10', 'u2']);
assert.deepEqual(sortInstanceSummaries([]), []);
const missingEnergies = [instanceSummary('large', 100, '10 × 10', 0, null), instanceSummary('small', 4, '2 × 2', 0, null)];
for (const direction of ['asc', 'desc']) assert.deepEqual(sortInstanceSummaries(missingEnergies, 'energy', direction).map(s => s.benchmark.id), ['small', 'large']);
const paper=id=>({id,title:'T',authors:'A. Author',published:id==='2601.00003v1'?'2026-03-01T00:00:00Z':'2026-01-01T00:00:00Z'});
const rows=[
  {benchmark_id:'b',method:'RBM',variant:'a=4',method_class:'rbm',energy_per_site:'-0.4950',uncertainty_per_site:'0.0002',parameter_count:400,paper:paper('2601.00001v1')},
  {benchmark_id:'b',method:'ViT',variant:'8 heads',method_class:'transformer',energy_per_site:'-0.4976',uncertainty_per_site:null,parameter_count:null,paper:paper('2601.00003v1')},
  {benchmark_id:'b',method:'GCNN',variant:'deep',method_class:'convolutional',energy_per_site:'-0.4975',uncertainty_per_site:'0.0001',parameter_count:120000,paper:paper('2601.00002v1')},
  {benchmark_id:'other',method:'RBM',variant:'x',method_class:'rbm',energy_per_site:'-1',uncertainty_per_site:null,parameter_count:null,paper:paper('2601.00004v1')},
];
assert.deepEqual(sortRows(filterRows(rows,{benchmarkId:'b'})).map(r=>r.method),['ViT','GCNN','RBM']);
assert.deepEqual(sortRows(filterRows(rows,{benchmarkId:'b'}),'energy','desc').map(r=>r.method),['RBM','GCNN','ViT']);
assert.deepEqual(sortRows(filterRows(rows,{benchmarkId:'b'}),'uncertainty','asc').map(r=>r.method),['GCNN','RBM','ViT'],'null uncertainty sorts last');
assert.deepEqual(sortRows(filterRows(rows,{benchmarkId:'b'}),'uncertainty','desc').map(r=>r.method),['RBM','GCNN','ViT'],'null still last when descending');
assert.deepEqual(sortRows(filterRows(rows,{benchmarkId:'b'}),'date','desc').map(r=>r.method),['ViT','RBM','GCNN']);
assert.deepEqual(filterRows(rows,{benchmarkId:'b',methodClass:'rbm'}).map(r=>r.method),['RBM']);
assert.deepEqual(filterRows(rows,{benchmarkId:'b',query:'2601.00002'}).map(r=>r.method),['GCNN']);
assert.equal(rankByEnergy(filterRows(rows,{benchmarkId:'b'})).get(rows[1]),1);
const summary=summarize([{id:'b'},{id:'none'}],rows);
assert.equal(summary[0].count,3);assert.equal(summary[0].best.method,'ViT');assert.deepEqual(summary[0].classes,['transformer','convolutional','rbm']);
assert.equal(summary[1].best,null);
const {withErrorBar}=await import('../site/leaderboard.mjs');
const {boundaryClass}=await import('../site/leaderboard.mjs');
const boundaryOf=text=>boundaryClass({boundary_conditions:text});
assert.equal(boundaryOf('Periodic in both directions'),'Periodic'); assert.equal(boundaryOf('Periodic along the three cubic axes'),'Periodic');
assert.equal(boundaryOf('Periodic along x, open along y'),'Cylinder'); assert.equal(boundaryOf('Open in all directions'),'Open');
assert.equal(boundaryOf('Periodic along one direction, antiperiodic along the other'),'Periodic × antiperiodic');
for (const b of registry) assert.ok(['Periodic','Periodic × antiperiodic','Cylinder','Open'].includes(boundaryClass(b)), b.id);
assert.equal(withErrorBar('-0.4976921','0.0000004').text,'-0.4976921(4)');
assert.equal(withErrorBar('-0.753','0.002').text,'-0.753(2)');
assert.equal(withErrorBar('-0.76413','0.00003').text,'-0.76413(3)');
assert.equal(withErrorBar('-0.7454','0.0009').text,'-0.7454(9)');
assert.equal(withErrorBar('-0.5','0.00002').text,'-0.5 ± 0.00002');
assert.deepEqual(withErrorBar('-0.7598',null),{text:'-0.7598',missing:true});
assert.equal(withErrorBar('-0.7430','0.0001','upper_bound').text,'-0.7430 ± <0.0001');
// Instance charts: the lowest energy so far steps down in time, ties are within twice the combined error bar of the
// lowest energy, and a poor baseline does not set the plotted range.
const {chartPoints, lowestSoFar, tiedWithLowest, niceTicks, focusRange} = await import('../site/charts.mjs');
const chartRow = (e, err, date) => ({energy_per_site: e, uncertainty_per_site: err, paper: {id: '2601.00001v1', published: date}});
const plotted = chartPoints([chartRow('-0.4950', '0.0001', '2019-03-01'), chartRow('-0.4976', '0.0001', '2020-06-01'), chartRow('-0.4970', '0.0002', '2021-01-01'), chartRow('-0.4977', '0.0001', '2023-02-01'), chartRow('-0.4880', '0.0070', '2021-10-01'), chartRow(null, null, '2022-01-01')]);
assert.equal(plotted.length, 5);
assert.deepEqual(lowestSoFar(plotted).map(p => p.energy), [-0.495, -0.4976, -0.4977]);
assert.deepEqual([...tiedWithLowest(plotted)].map(p => p.energy).sort((a, b) => a - b), [-0.4977, -0.4976, -0.488]);
const range = focusRange(plotted);
assert.deepEqual(range.outside.map(p => p.energy), [-0.488]); assert.ok(range.hi < -0.494 && range.lo < -0.4977);
assert.equal(focusRange(plotted.slice(0, 3)).outside.length, 0);
assert.deepEqual(niceTicks(-0.4978, -0.4949, 5), {ticks: [-0.497, -0.496, -0.495], decimals: 3});
assert.deepEqual(niceTicks(-1.2, -0.5, 4), {ticks: [-1.2, -1, -0.8, -0.6], decimals: 1});
console.log('Ketboard filtering, sorting, ranking, summary, error-bar and chart checks pass.');
// A stray closing tag silently ends <main>, so the structure of the shipped HTML is checked here.
for (const file of ['site/index.html', 'site/wiki.template.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  for (const tag of ['div', 'section', 'form', 'table', 'details']) {
    const open = (main.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length, close = (main.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    assert.equal(open, close, `${file}: <${tag}> opens ${open} times but closes ${close} times inside <main>`);
  }
}
console.log('HTML structure of the homepage and article template is balanced.');
