const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
// Mirrors METHOD_CLASSES in nqsbot/schema.py; labels are what Ketboard displays.
export const METHOD_CLASSES = {rbm:'Boltzmann machine', feed_forward:'Feed-forward', convolutional:'Convolutional', autoregressive:'Autoregressive', transformer:'Transformer', backflow:'Backflow / determinant', hybrid:'Hybrid', other:'Other'};
function canonicalDecimal(value) {
  const [mantissa, exponent='0']=value.toLowerCase().replace(/^\+/, '').split('e');
  const negative=mantissa.startsWith('-'), unsigned=mantissa.replace(/^-/, '');
  let digits=unsigned.replace('.', '').replace(/^0+/, ''), power=BigInt(exponent)-BigInt((unsigned.split('.')[1]||'').length);
  if(!digits)return '0';
  while(digits.endsWith('0')){digits=digits.slice(0,-1);power++;}
  return `${negative?'-':''}${digits}e${power}`;
}
export function makeSubmission(values, benchmark) {
  const v = name => String(values[name] || '').trim();
  if (!/^\d{4}\.\d{4,5}v[1-9]\d*$/.test(v('paper_id'))) throw Error('Use an exact arXiv version, such as 2501.12345v2.');
  for (const key of ['title','authors','method','variant','source_location','eligibility_evidence']) if(!v(key)) throw Error('Complete the paper, method, and source fields.');
  if (!benchmark || benchmark.id !== v('benchmark_id')) throw Error('Choose a registered benchmark.');
  if (!(v('method_class') in METHOD_CLASSES)) throw Error('Choose the architecture class of the neural state.');
  if (!DECIMAL.test(v('energy')) || !Number.isFinite(Number(v('energy')))) throw Error('Enter the energy as a finite decimal.');
  if (!['total','per_site'].includes(v('normalization'))) throw Error('Choose total or per-site energy.');
  const uncertainty=v('uncertainty')||null, uncertaintyType=v('uncertainty_type');
  if (!['not_reported','standard_error','standard_deviation','confidence_interval','unspecified'].includes(uncertaintyType)) throw Error('Choose the uncertainty meaning.');
  if (uncertainty!==null && (!DECIMAL.test(uncertainty)||!Number.isFinite(Number(uncertainty))||Number(uncertainty)<0) || ((uncertainty===null)!==(uncertaintyType==='not_reported'))) throw Error('The uncertainty value and its meaning must agree.');
  const token=v('energy_token').replaceAll('−','-').match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\((\d+)\))?([eE][+-]?\d+)?$/);
  if(!token||canonicalDecimal(token[1]+(token[3]||''))!==canonicalDecimal(v('energy'))) throw Error('The printed energy token must match the decimal energy.');
  if(token[2]){
    const places=token[1].includes('.')?token[1].split('.')[1].length:0, exponent=token[3]?Number(token[3].slice(1)):0;
    const expected=`${token[2]}e${exponent-places}`;
    if(uncertainty===null||canonicalDecimal(expected)!==canonicalDecimal(uncertainty))throw Error('The uncertainty must agree with the parentheses in the printed token.');
  }
  return {schema_version:1,paper:{id:v('paper_id'),title:v('title'),authors:v('authors'),published:'',updated:''},source_url:`https://arxiv.org/pdf/${v('paper_id')}`,source_sha256:null,extraction_model:'human',results:[{benchmark_id:benchmark.id,system_description:`${benchmark.geometry}; ${benchmark.sector}`,method:v('method'),variant:v('variant'),method_class:v('method_class'),method_type:'nqs',energy_type:'variational',reported_here:true,energy:v('energy'),energy_token:v('energy_token'),normalization:v('normalization'),unit:benchmark.unit,uncertainty,uncertainty_type:uncertaintyType,source_location:v('source_location'),eligibility_evidence:v('eligibility_evidence'),parameter_count:null,notes:v('notes')}],issues:[]};
}
