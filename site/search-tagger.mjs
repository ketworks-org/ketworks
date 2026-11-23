// The learned search tagger: BERT-tiny (2 layers, hidden size 128) fine-tuned by tagger/train.py to label the words
// of a Ketboard query, run here in plain JavaScript without a library. search.mjs asks it only about the words its
// rule vocabulary does not know ("frustrated", "toroidal", "artificial atom"); every other word keeps its rule tag.
// Weights (search-model/tagger.bin) and the WordPiece vocabulary (search-model/vocab.txt) are fetched once, when a
// query first has such a word. tagger/train.py computes reference logits with the same arithmetic in NumPy, and
// scripts/check-search.mjs compares them with this file.

// WordPiece, as in tagger/train.py: search tokens are already lower-case and without accents.
const PUNCTUATION = /^(?:[!-\/:-@\[-`{-~]|\p{P})$/u;
function basicSplit(text) {
  const words = []; let current = '';
  for (const ch of text) {
    if (/\s/.test(ch)) { if (current) words.push(current); current = ''; }
    else if (PUNCTUATION.test(ch)) { if (current) words.push(current); words.push(ch); current = ''; }
    else current += ch;
  }
  if (current) words.push(current);
  return words;
}
export function wordpieces(token, vocab) {
  const pieces = [];
  for (const word of basicSplit(token)) {
    const chars = [...word];
    if (chars.length > 100) { pieces.push('[UNK]'); continue; }
    let start = 0; const sub = [];
    while (start < chars.length) {
      let end = chars.length, found = null;
      while (start < end) {
        const piece = (start ? '##' : '') + chars.slice(start, end).join('');
        if (vocab.has(piece)) { found = piece; break; }
        end--;
      }
      if (found === null) { sub.length = 0; sub.push('[UNK]'); break; }
      sub.push(found); start = end;
    }
    pieces.push(...sub);
  }
  return pieces.length ? pieces : ['[UNK]'];
}
export function encode(tokens, vocab, maxPieces) {
  const ids = [vocab.get('[CLS]')], first = [];
  for (const token of tokens) {
    const pieces = wordpieces(token, vocab);
    if (ids.length + pieces.length >= maxPieces - 1) { first.push(null); continue; }
    first.push(ids.length);
    for (const p of pieces) ids.push(vocab.get(p));
  }
  ids.push(vocab.get('[SEP]'));
  return {ids, first};
}

// tagger.bin: "KTG1", a little-endian uint32 header length, a JSON header (configuration, labels, tensor table), then
// the tensors, each 4-byte aligned: float32, float16, or int8 with one float32 scale per row (word embeddings).
function half(h) {
  const sign = h & 0x8000 ? -1 : 1, exponent = (h >> 10) & 31, fraction = h & 1023;
  if (exponent === 0) return sign * fraction * 2 ** -24;
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
}
export function parseModel(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'KTG1') throw new Error('Not a Ketworks tagger file');
  const length = view.getUint32(4, true), header = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + length))), data = 8 + length;
  const model = {config: header.config};
  for (const [name, t] of Object.entries(header.tensors)) {
    const count = t.shape.reduce((a, b) => a * b, 1), offset = data + t.offset;
    if (t.dtype === 'f32') model[name] = new Float32Array(buffer.slice(offset, offset + 4 * count));
    else if (t.dtype === 'i8') model[name] = new Int8Array(buffer.slice(offset, offset + count));
    else { const raw = new Uint16Array(buffer.slice(offset, offset + 2 * count)), out = new Float32Array(count); for (let i = 0; i < count; i++) out[i] = half(raw[i]); model[name] = out; }
  }
  return model;
}

// Abramowitz and Stegun 7.1.26 (absolute error below 1.5e-7), as in tagger/train.py.
function erf(x) {
  const sign = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
}
function linear(x, n, inDim, w, b, outDim) {
  const y = new Float32Array(n * outDim);
  for (let i = 0; i < n; i++) for (let o = 0; o < outDim; o++) {
    let acc = b[o];
    for (let k = 0, xi = i * inDim, wo = o * inDim; k < inDim; k++) acc += x[xi + k] * w[wo + k];
    y[i * outDim + o] = acc;
  }
  return y;
}
function layerNorm(x, n, dim, gamma, beta, eps) {
  for (let i = 0; i < n; i++) {
    let mean = 0, variance = 0;
    for (let k = 0; k < dim; k++) mean += x[i * dim + k];
    mean /= dim;
    for (let k = 0; k < dim; k++) variance += (x[i * dim + k] - mean) ** 2;
    const scale = 1 / Math.sqrt(variance / dim + eps);
    for (let k = 0; k < dim; k++) x[i * dim + k] = (x[i * dim + k] - mean) * scale * gamma[k] + beta[k];
  }
}
export function forward(model, ids) {
  const {hidden: H, heads, layers, intermediate: I, eps, labels} = model.config, n = ids.length, dh = H / heads, L = labels.length;
  const x = new Float32Array(n * H);
  for (let i = 0; i < n; i++) { const id = ids[i], s = model.word_scale[id]; for (let k = 0; k < H; k++) x[i * H + k] = model.word[id * H + k] * s + model.position[i * H + k] + model.type[k]; }
  layerNorm(x, n, H, model.embed_ln_w, model.embed_ln_b, eps);
  const scores = new Float64Array(n);
  for (let l = 0; l < layers; l++) {
    const w = name => model[`l${l}_${name}`];
    const q = linear(x, n, H, w('q_w'), w('q_b'), H), k = linear(x, n, H, w('k_w'), w('k_b'), H), v = linear(x, n, H, w('v_w'), w('v_b'), H), ctx = new Float32Array(n * H);
    for (let h = 0; h < heads; h++) for (let i = 0; i < n; i++) {
      let max = -Infinity, sum = 0;
      for (let j = 0; j < n; j++) { let s = 0; for (let d = 0; d < dh; d++) s += q[i * H + h * dh + d] * k[j * H + h * dh + d]; scores[j] = s / Math.sqrt(dh); if (scores[j] > max) max = scores[j]; }
      for (let j = 0; j < n; j++) { scores[j] = Math.exp(scores[j] - max); sum += scores[j]; }
      for (let d = 0; d < dh; d++) { let acc = 0; for (let j = 0; j < n; j++) acc += scores[j] * v[j * H + h * dh + d]; ctx[i * H + h * dh + d] = acc / sum; }
    }
    const o = linear(ctx, n, H, w('o_w'), w('o_b'), H);
    for (let i = 0; i < n * H; i++) x[i] += o[i];
    layerNorm(x, n, H, w('ln1_w'), w('ln1_b'), eps);
    const hidden = linear(x, n, H, w('i_w'), w('i_b'), I);
    for (let i = 0; i < hidden.length; i++) hidden[i] = 0.5 * hidden[i] * (1 + erf(hidden[i] / Math.SQRT2));
    const f = linear(hidden, n, I, w('f_w'), w('f_b'), H);
    for (let i = 0; i < n * H; i++) x[i] += f[i];
    layerNorm(x, n, H, w('ln2_w'), w('ln2_b'), eps);
  }
  const logits = linear(x, n, H, model.classifier_w, model.classifier_b, L), rows = [];
  for (let i = 0; i < n; i++) rows.push(logits.subarray(i * L, (i + 1) * L));
  return rows;
}

// A tagger for search.mjs: one label per search token, "O" where the model is unsure (below the threshold).
export function createTagger(buffer, vocabText, {threshold = 0.7} = {}) {
  const model = parseModel(buffer), labels = model.config.labels;
  const vocab = new Map(vocabText.split('\n').filter(line => line.length).map((piece, id) => [piece, id]));
  const logits = texts => { const {ids, first} = encode(texts, vocab, model.config.positions), rows = forward(model, ids); return {ids, first, logits: first.map(p => p === null ? null : rows[p])}; };
  const tagger = tokens => logits(tokens.map(t => typeof t === 'string' ? t : t.text)).logits.map(row => {
    if (!row) return 'O';
    let best = 0, max = -Infinity, sum = 0;
    for (let k = 0; k < row.length; k++) if (row[k] > max) { max = row[k]; best = k; }
    for (let k = 0; k < row.length; k++) sum += Math.exp(row[k] - max);
    return 1 / sum >= threshold ? labels[best] : 'O';
  });
  tagger.logits = logits;
  tagger.labels = labels;
  return tagger;
}
export async function loadTagger(base = 'search-model/') {
  const [bin, vocab] = await Promise.all([
    fetch(base + 'tagger.bin').then(r => { if (!r.ok) throw new Error('Tagger unavailable'); return r.arrayBuffer(); }),
    fetch(base + 'vocab.txt').then(r => { if (!r.ok) throw new Error('Tagger unavailable'); return r.text(); }),
  ]);
  return createTagger(bin, vocab);
}
