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
const {makeSubmission}=await import('../site/submission.mjs');
const benchmark=JSON.parse(fs.readFileSync('data/benchmarks.json','utf8'))[0];
const fields={paper_id:'2601.00001v1',benchmark_id:benchmark.id,title:'Synthetic test',authors:'Test',method:'Test NQS',variant:'Test',method_class:'rbm',energy:'-50.000',energy_token:'-50.000(20)',normalization:'total',uncertainty:'0.020',uncertainty_type:'standard_error',source_location:'Synthetic Table 1',eligibility_evidence:'Synthetic test only',notes:''};
const submission=makeSubmission(fields,benchmark);
assert.equal(submission.source_sha256,null);
assert.equal(submission.extraction_model,'human');
assert.equal(submission.results[0].energy,'-50.000');
assert.throws(()=>makeSubmission({...fields,energy:'-60'},benchmark));
assert.throws(()=>makeSubmission({...fields,energy:'-50.000000000000000001'},benchmark));
assert.throws(()=>makeSubmission({...fields,uncertainty:'0.2'},benchmark));
assert.throws(()=>makeSubmission({...fields,paper_id:'2601.00001'},benchmark));
assert.throws(()=>makeSubmission({...fields,uncertainty_type:'not_reported'},benchmark));
assert.throws(()=>makeSubmission({...fields,method_class:'RBM'},benchmark));
assert.equal(submission.results[0].method_class,'rbm');
console.log('Human contribution generation and invalid-input checks pass.');
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
console.log('Ketboard filtering, sorting, ranking, and summary checks pass.');
