'use strict';
let dataset;
const $ = id => document.getElementById(id);
const text = (tag, value, className) => { const el = document.createElement(tag); el.textContent = value; if (className) el.className = className; return el; };
function lattice(triangular = false) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 68 66'); svg.setAttribute('aria-hidden', 'true');
  const points = Array.from({length: 9}, (_, i) => [10 + i % 3 * 21 + (triangular && Math.floor(i / 3) % 2 ? 8 : 0), 10 + Math.floor(i / 3) * 21]);
  points.forEach(([x,y], i) => { [i % 3 < 2 ? i + 1 : -1, i < 6 ? i + 3 : -1, triangular && i < 6 && i % 3 < 2 ? i + 4 : -1].filter(j => j >= 0).forEach(j => { const line = document.createElementNS(ns, 'line'); Object.entries({x1:x,y1:y,x2:points[j][0],y2:points[j][1]}).forEach(([k,v]) => line.setAttribute(k,v)); svg.append(line); }); });
  points.forEach(([cx,cy]) => { const circle = document.createElementNS(ns,'circle'); Object.entries({cx,cy,r:3}).forEach(([k,v]) => circle.setAttribute(k,v)); svg.append(circle); }); return svg;
}
function route() {
  const routeName = location.hash.slice(1).split('?')[0] || 'overview';
  const name = ['overview','benchmarks','learn','contribute'].includes(routeName) ? routeName : 'overview';
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== name);
  document.querySelectorAll('[data-nav]').forEach(el => { if (el.dataset.nav === name) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  const selected = new URLSearchParams(location.hash.split('?')[1] || '').get('system');
  if (dataset && selected && dataset.benchmarks.some(b => b.id === selected)) $('system-select').value = selected;
  if (dataset) renderResults();
  document.title = `${name === "benchmarks" ? "Ketboard" : name.charAt(0).toUpperCase()+name.slice(1)} — Ketbook`;
}
function renderCards() {
  dataset.benchmarks.forEach(benchmark => {
    const card = text('a','', 'model-card'); card.href = '#benchmarks?system=' + encodeURIComponent(benchmark.id);
    const count = dataset.results.filter(r => r.benchmark_id === benchmark.id).length;
    const top = text('div','', 'card-top'); top.append(lattice(benchmark.family.includes('Triangular')),text('span',`${count} reviewed results`,'card-count'));
    const bottom = text('div','','card-bottom'); bottom.append(text('span',`${benchmark.sites} sites · periodic boundaries`),text('span','↗'));
    card.append(top,text('h3',benchmark.family),text('p',benchmark.description),bottom); $('model-cards').append(card);
    const option = text('option',benchmark.name); option.value = benchmark.id; $('system-select').append(option);
  });
}
function currentRows() {
  const query = $('search').value.toLowerCase();
  return dataset.results.filter(r => r.benchmark_id === $('system-select').value && `${r.method} ${r.variant} ${r.paper.authors} ${r.paper.title} ${r.paper.id}`.toLowerCase().includes(query)).sort((a,b) => Number(a.energy_per_site)-Number(b.energy_per_site));
}
function sourceLink(label,url) { const a = text('a',label); a.href = url; a.target='_blank'; a.rel='noopener noreferrer'; return a; }
function renderResults() {
  const benchmark = dataset.benchmarks.find(b => b.id === $('system-select').value); if (!benchmark) return;
  $('system-definition').replaceChildren(text('h3',benchmark.name));
  const dl = document.createElement('dl'); [['Hamiltonian',benchmark.hamiltonian],['Geometry',benchmark.geometry],['Sector',benchmark.sector],['Energy units',`${benchmark.unit} per site`]].forEach(([key,value]) => dl.append(text('dt',key),text('dd',value))); $('system-definition').append(dl);
  const rows = currentRows(); $('results').replaceChildren();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const method = text('td',row.method); method.append(text('small',row.variant));
    const energy = text('td',row.energy_per_site,'energy');
    const uncertainty = text('td',row.uncertainty_per_site === null ? 'Not reported' : `± ${row.uncertainty_per_site}`); uncertainty.append(text('small',row.uncertainty_type.replaceAll('_',' ')));
    const paper = text('td',''); paper.append(sourceLink(row.paper.id,`https://arxiv.org/abs/${row.paper.id}`),text('small',row.paper.published.slice(0,10))); paper.title = `${row.paper.title} — ${row.paper.authors}`;
    const evidence = text('td',''); evidence.append(sourceLink(row.source_location,row.source_url));
    tr.append(method,energy,uncertainty,paper,evidence); $('results').append(tr);
  });
  $('result-count').textContent = `${rows.length} result${rows.length===1?'':'s'}`;
  $('empty-results').hidden = rows.length > 0;
  const hasAny = dataset.results.some(r=>r.benchmark_id===benchmark.id);
  $('empty-results').querySelector('h3').textContent = hasAny ? 'No results match this search.' : 'No reviewed results yet.';
  $('empty-results').querySelector('p').textContent = hasAny ? 'Try another method, author, or paper identifier.' : 'This instance is ready for contributions. Results appear here after their pull request is approved and merged.';
}
window.addEventListener('hashchange',route);
$('system-select').addEventListener('change',()=>{location.hash='#benchmarks?system='+encodeURIComponent($('system-select').value);});
$('search').addEventListener('input',()=>{if(dataset)renderResults();});
$('download').addEventListener('click',()=>{ if(!dataset)return; const benchmark=dataset.benchmarks.find(b=>b.id===$('system-select').value); const blob=new Blob([JSON.stringify({benchmark,results:currentRows()},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=`${benchmark.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); });
route();
fetch('data.json').then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();}).then(data=>{dataset=data;renderCards();route();}).catch(()=>{$('load-error').hidden=false;});
