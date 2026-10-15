import fs from 'node:fs';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';

export const mathOptions = {throwOnError: true, trust: false, strict: 'error', output: 'htmlAndMathml', maxExpand: 1000};
export const md = new MarkdownIt({html: false, linkify: false}).use(texmath, {engine: katex, delimiters: ['dollars', 'brackets'], katexOptions: mathOptions});

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
