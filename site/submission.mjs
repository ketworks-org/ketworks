const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const TOKEN = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\((\d+)\))?([eE][+-]?\d+)?$/;
// Mirrors METHOD_CLASSES in nqsbot/schema.py; labels are what Ketboard displays.
export const METHOD_CLASSES = {rbm:'Boltzmann machine', feed_forward:'Feed-forward', convolutional:'Convolutional', autoregressive:'Autoregressive', transformer:'Transformer', backflow:'Backflow / determinant', hybrid:'Hybrid', other:'Other'};
export const UNCERTAINTY_TYPES = ['not_reported','standard_error','standard_deviation','confidence_interval','unspecified'];

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
  const {token, energy, uncertainty} = parseToken(v('energy_token'));
  const uncertaintyType = v('uncertainty_type');
  if (!UNCERTAINTY_TYPES.includes(uncertaintyType)) throw Error('Choose the uncertainty meaning.');
  if ((uncertainty === null) !== (uncertaintyType === 'not_reported')) throw Error(uncertainty === null ? 'The printed energy has no parenthesized uncertainty; choose "Not reported".' : 'The printed energy carries an uncertainty; choose what it means.');
  const count = v('parameter_count');
  if (count && !/^\d+$/.test(count)) throw Error('The parameter count must be a whole number.');
  return {schema_version:1,paper:{id:v('paper_id'),title:v('title'),authors:v('authors'),published:'',updated:''},source_url:`https://arxiv.org/pdf/${v('paper_id')}`,source_sha256:null,extraction_model:'human',results:[{benchmark_id:benchmark.id,system_description:`${benchmark.geometry}; ${benchmark.sector}`,method:v('method'),variant:v('variant'),method_class:v('method_class'),method_type:'nqs',energy_type:'variational',reported_here:true,energy,energy_token:token,normalization:v('normalization'),unit:benchmark.unit,uncertainty,uncertainty_type:uncertaintyType,source_location:v('source_location'),eligibility_evidence:v('eligibility_evidence'),parameter_count:count?Number(count):null,notes:v('notes')}],issues:[]};
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
