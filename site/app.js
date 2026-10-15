import {makeSubmission} from './submission.mjs';
let dataset, submission;
const $ = id => document.getElementById(id);
const text = (tag, value, className) => { const el = document.createElement(tag); el.textContent = value; if(className)el.className=className; return el; };
function lattice(triangular=false) {
  const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 68 66');svg.setAttribute('aria-hidden','true');
  const points=Array.from({length:9},(_,i)=>[10+i%3*21+(triangular&&Math.floor(i/3)%2?8:0),10+Math.floor(i/3)*21]);
  points.forEach(([x,y],i)=>{[i%3<2?i+1:-1,i<6?i+3:-1,triangular&&i<6&&i%3<2?i+4:-1].filter(j=>j>=0).forEach(j=>{const line=document.createElementNS(ns,'line');Object.entries({x1:x,y1:y,x2:points[j][0],y2:points[j][1]}).forEach(([k,v])=>line.setAttribute(k,v));svg.append(line);});});
  points.forEach(([cx,cy])=>{const circle=document.createElementNS(ns,'circle');Object.entries({cx,cy,r:3}).forEach(([k,v])=>circle.setAttribute(k,v));svg.append(circle);});return svg;
}
function route(){
  const requested=location.hash.slice(1).split('?')[0]||'overview';
  const name=['overview','benchmarks','wiki','contribute','submit'].includes(requested)?requested:(requested==='learn'?'wiki':'overview');
  document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==name);
  document.querySelectorAll('[data-nav]').forEach(el=>{if(el.dataset.nav===name)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('system');
  if(dataset&&selected&&dataset.benchmarks.some(b=>b.id===selected))$('system-select').value=selected;
  if(dataset)renderResults();
  document.title=name==='overview'?'Ketbook — Neural quantum states':`${name==='benchmarks'?'Ketboard':name.charAt(0).toUpperCase()+name.slice(1)} — Ketbook`;
}
function renderCards(){
  dataset.benchmarks.forEach(benchmark=>{
    const card=text('a','','model-card');card.href='#benchmarks?system='+encodeURIComponent(benchmark.id);
    const count=dataset.results.filter(r=>r.benchmark_id===benchmark.id).length;
    const top=text('div','','card-top');top.append(lattice(benchmark.family.includes('Triangular')),text('span',`${count} reviewed results`,'card-count'));
    const bottom=text('div','','card-bottom');bottom.append(text('span',`${benchmark.sites} sites · periodic boundaries`),text('span','↗'));
    card.append(top,text('h3',benchmark.family),text('p',benchmark.description),bottom);$('model-cards').append(card);
    for(const id of ['system-select','submit-system']){const option=text('option',benchmark.name);option.value=benchmark.id;$(id).append(option);}
  });
}
function renderWiki(){
  const query=$('wiki-search').value.toLowerCase();$('wiki-list').replaceChildren();
  dataset.wiki.forEach((page,index)=>{if(!`${page.title} ${page.section} ${page.summary}`.toLowerCase().includes(query))return;
    const a=text('a','','wiki-row');a.href=`wiki/${page.slug}/`;const content=text('div','');content.append(text('h2',page.title),text('p',page.summary));
    a.append(text('span',String(index+1).padStart(2,'0'),'wiki-number'),text('span',page.section,'wiki-category'),content,text('span','↗'));$('wiki-list').append(a);
  });$('wiki-empty').hidden=$('wiki-list').childElementCount>0;
}
function currentRows(){const q=$('search').value.toLowerCase();return dataset.results.filter(r=>r.benchmark_id===$('system-select').value&&`${r.method} ${r.variant} ${r.paper.authors} ${r.paper.title} ${r.paper.id}`.toLowerCase().includes(q)).sort((a,b)=>Number(a.energy_per_site)-Number(b.energy_per_site));}
function link(label,url){const a=text('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderResults(){
  const b=dataset.benchmarks.find(b=>b.id===$('system-select').value);if(!b)return;
  $('system-definition').replaceChildren(text('h3',b.name));const dl=document.createElement('dl');
  const h=text('dd','');if(b.hamiltonian_html)h.innerHTML=b.hamiltonian_html;else h.textContent=b.hamiltonian;
  dl.append(text('dt','Hamiltonian'),h);
  [['Convention',b.hamiltonian],['Geometry',b.geometry],['Sector',b.sector],['Units',`${b.unit} per site`]].forEach(([k,v])=>dl.append(text('dt',k),text('dd',v)));
  $('system-definition').append(dl);const rows=currentRows();$('results').replaceChildren();
  rows.forEach(row=>{const tr=document.createElement('tr'),method=text('td',row.method);method.append(text('small',row.variant));
    const energy=text('td',row.energy_per_site,'energy'),uncertainty=text('td',row.uncertainty_per_site===null?'Not reported':`± ${row.uncertainty_per_site}`);uncertainty.append(text('small',row.uncertainty_type.replaceAll('_',' ')));
    const paper=text('td','');paper.append(link(row.paper.id,`https://arxiv.org/abs/${row.paper.id}`),text('small',row.paper.published.slice(0,10)));paper.title=`${row.paper.title} — ${row.paper.authors}`;
    const evidence=text('td','');evidence.append(link(row.source_location,row.source_url));tr.append(method,energy,uncertainty,paper,evidence);$('results').append(tr);
  });
  $('result-count').textContent=`${rows.length} result${rows.length===1?'':'s'}`;$('empty-results').hidden=rows.length>0;
  const any=dataset.results.some(r=>r.benchmark_id===b.id);$('empty-results').querySelector('h3').textContent=any?'No results match this search.':'The first result starts here.';
  $('empty-results').querySelector('p').textContent=any?'Try another method, author, or paper identifier.':'Results appear after their pull request has been reviewed and merged.';
}
function download(value,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function prepareSubmission(event){
  event.preventDefault();$('submission-error').textContent='';if(!dataset)return;
  const values=Object.fromEntries(new FormData(event.target));
  const b=dataset.benchmarks.find(b=>b.id===values.benchmark_id);
  try { submission=makeSubmission(values,b); } catch(error) { $('submission-error').textContent=error.message; return; }
  const id=submission.paper.id;
  const filename=`data/results/${id.replace(/v\d+$/,'')}.json`,json=JSON.stringify(submission,null,2)+'\n';
  $('submission-json').textContent=json;
  const sourceRef=dataset.source_ref.split('/').map(encodeURIComponent).join('/');
  $('github-new-result').href=`https://github.com/gcarleo/ketbook/new/${sourceRef}?`+new URLSearchParams({filename,value:json}).toString();
  $('github-edit-result').href=`https://github.com/gcarleo/ketbook/edit/${sourceRef}/${filename}`;
  $('submission-ready').hidden=false;$('submission-ready').scrollIntoView({behavior:'smooth',block:'start'});
}
window.addEventListener('hashchange',route);
$('system-select').addEventListener('change',()=>location.hash='#benchmarks?system='+encodeURIComponent($('system-select').value));
$('search').addEventListener('input',()=>{if(dataset)renderResults();});$('wiki-search').addEventListener('input',()=>{if(dataset)renderWiki();});
$('download').addEventListener('click',()=>{if(dataset)download({benchmark:dataset.benchmarks.find(b=>b.id===$('system-select').value),results:currentRows()},`${$('system-select').value}.json`);});
$('submission-form').addEventListener('submit',prepareSubmission);$('download-result').addEventListener('click',()=>{if(submission)download(submission,submission.paper.id.replace(/v\d+$/,'')+'.json');});
route();fetch('data.json').then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();}).then(data=>{dataset=data;renderCards();renderWiki();route();}).catch(()=>{$('load-error').hidden=false;});
