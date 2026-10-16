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
assert.throws(() => instanceFromForm({model:'j1j2',lattice:'square',lx:'10',ly:'8',boundaries:'pbc',j2:'0.5'}), /equal extents/);
assert.throws(() => instanceFromForm({model:'hubbard',lattice:'square',lx:'4',ly:'4',boundaries:'pbc',u:'8',nup:'20',ndown:'2'}), /electrons/);
const custom = instanceFromForm({model:'custom',lattice:'square',lx:'6',ly:'6',boundaries:'pbc',system_name:'Kagome Heisenberg',hamiltonian_text:'H = ...',unit:'J',category:'lattice-spins'});
assert.equal(custom.id, 'kagome-heisenberg-square-6x6-pbc'); assert.equal(custom.family, 'Kagome Heisenberg'); assert.equal(custom.category, 'lattice-spins');
assert.throws(() => instanceFromForm({model:'custom',lattice:'square',lx:'6',ly:'6',boundaries:'pbc',system_name:'Kagome Heisenberg',hamiltonian_text:'H = ...',unit:'J'}), /class of system/);
const proposal = makeProposal({...fields, system_description:'Shuriken lattice Heisenberg, 24 sites, periodic, Sz = 0', unit:'J'});
assert.equal(proposal.results[0].benchmark_id, null); assert.equal(proposal.results[0].unit, 'J'); assert.equal(proposal.results[0].energy, '-50.000');
assert.throws(() => makeProposal({...fields, unit:'J'}), /Describe the system/);
console.log('Human contribution generation, new-instance keys, proposals and invalid-input checks pass.');
const {filterRows,sortRows,rankByEnergy,summarize}=await import('../site/leaderboard.mjs');
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
assert.equal(withErrorBar('-0.4976921','0.0000004').text,'-0.4976921(4)');
assert.equal(withErrorBar('-0.753','0.002').text,'-0.753(2)');
assert.equal(withErrorBar('-0.76413','0.00003').text,'-0.76413(3)');
assert.equal(withErrorBar('-0.7454','0.0009').text,'-0.7454(9)');
assert.equal(withErrorBar('-0.5','0.00002').text,'-0.5 ± 0.00002');
assert.deepEqual(withErrorBar('-0.7598',null),{text:'-0.7598',missing:true});
assert.equal(withErrorBar('-0.7430','0.0001','upper_bound').text,'-0.7430 ± <0.0001');
console.log('Ketboard filtering, sorting, ranking, summary and error-bar checks pass.');
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
