import fs from 'node:fs';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';

export const mathOptions = {throwOnError: true, trust: false, strict: 'error', output: 'htmlAndMathml', maxExpand: 1000};
export const md = new MarkdownIt({html: false, linkify: false}).use(texmath, {engine: katex, delimiters: ['dollars', 'brackets'], katexOptions: mathOptions});
export function renderMarkdown(source) {
  const tokens = md.parse(source, {});
  function check(tokens) { for (const token of tokens) { if (token.type.startsWith('math_')) katex.renderToString(token.content, {...mathOptions, displayMode: token.block}); if (token.children) check(token.children); } }
  check(tokens);
  return md.renderer.render(tokens, md.options, {});
}
if (process.argv[1]?.endsWith('render-content.mjs')) {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const articles = input.articles.map(article => ({...article, html: renderMarkdown(article.markdown)}));
  const equations = Object.fromEntries(Object.entries(input.equations).map(([id, tex]) => [id, katex.renderToString(tex, {...mathOptions, displayMode: true})]));
  process.stdout.write(JSON.stringify({articles,equations}));
}
