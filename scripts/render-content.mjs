import fs from 'node:fs';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';

export const mathOptions = {throwOnError: true, trust: false, strict: 'error', output: 'htmlAndMathml', maxExpand: 1000};
export const md = new MarkdownIt({html: false, linkify: false}).use(texmath, {engine: katex, delimiters: ['dollars', 'brackets'], katexOptions: mathOptions});

// Every arXiv identifier in running text becomes a link to its abstract page. Code, math and existing links are left alone.
const ARXIV = /arXiv:((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?)/g;
export function arxivUrl(id) { return `https://arxiv.org/abs/${id}`; }
md.core.ruler.push('arxiv_links', state => {
  for (const block of state.tokens) {
    if (block.type !== 'inline') continue;
    const out = []; let depth = 0;
    for (const token of block.children) {
      if (token.type === 'link_open') depth++;
      if (token.type === 'link_close') depth--;
      if (token.type !== 'text' || depth > 0 || !ARXIV.test(token.content)) { ARXIV.lastIndex = 0; out.push(token); continue; }
      ARXIV.lastIndex = 0;
      let last = 0;
      for (const match of token.content.matchAll(ARXIV)) {
        if (match.index > last) out.push(Object.assign(new state.Token('text', '', 0), {content: token.content.slice(last, match.index)}));
        const open = new state.Token('link_open', 'a', 1); open.attrSet('href', arxivUrl(match[1])); open.attrSet('class', 'arxiv');
        const text = Object.assign(new state.Token('text', '', 0), {content: match[0]});
        out.push(open, text, new state.Token('link_close', 'a', -1));
        last = match.index + match[0].length;
      }
      if (last < token.content.length) out.push(Object.assign(new state.Token('text', '', 0), {content: token.content.slice(last)}));
    }
    block.children = out;
  }
});

// Plain-text rendering of inline math for heading ids and the table of contents.
export function mathToText(tex) {
  return tex.replace(/\\times/g, '×').replace(/\\(?:tfrac|frac)\s*(\d)(\d)/g, '$1/$2').replace(/\\(?:approx|simeq)/g, '≈').replace(/\\le(?:q)?\b/g, '≤').replace(/\\ge(?:q)?\b/g, '≥')
    .replace(/\\(?:mathrm|mathbf|boldsymbol|text|operatorname)\s*\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/[{}^_\\]/g, '').replace(/\s+/g, ' ').trim();
}

export function slugify(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'section';
}

// Render Markdown to HTML; section headings get stable ids so pages can link to them and show a table of contents.
export function renderArticle(source) {
  const tokens = md.parse(source, {});
  const headings = [], seen = new Set();
  function check(list) { for (const token of list) { if (token.type.startsWith('math_')) katex.renderToString(token.content, {...mathOptions, displayMode: token.block}); if (token.children) check(token.children); } }
  check(tokens);
  tokens.forEach((token, i) => {
    if (token.type !== 'heading_open' || !['h2', 'h3'].includes(token.tag)) return;
    const text = tokens[i + 1].children.filter(t => ['text', 'code_inline', 'math_inline'].includes(t.type)).map(t => t.type === 'math_inline' ? mathToText(t.content) : t.content).join('').trim();
    let id = slugify(text), n = 2;
    while (seen.has(id)) id = `${slugify(text)}-${n++}`;
    seen.add(id);
    token.attrSet('id', id);
    headings.push({id, text, level: Number(token.tag[1])});
  });
  return {html: md.renderer.render(tokens, md.options, {}), headings};
}
export function renderMarkdown(source) { return renderArticle(source).html; }

if (process.argv[1]?.endsWith('render-content.mjs')) {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const articles = input.articles.map(article => ({...article, ...renderArticle(article.markdown)}));
  const equations = Object.fromEntries(Object.entries(input.equations).map(([id, tex]) => [id, katex.renderToString(tex, {...mathOptions, displayMode: true})]));
  process.stdout.write(JSON.stringify({articles,equations}));
}
