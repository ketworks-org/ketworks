# Contributing to Ketbook and Ketboard

Wiki pages and NQS energy results both enter through pull requests. Anyone can propose a contribution. You do not need direct write access: GitHub can create a fork and a branch for your proposal. A maintainer reviews and merges the change. Contributions are released under the repository's [MIT License](LICENSE).

Every pull request gets a preview of the site with the change applied. A few minutes after each push, a comment on the pull request links to it and to the instances, entries and pages that changed. The preview carries a yellow banner and is not indexed.

## Edit the wiki

1. Open an article on Ketbook and choose **Edit this page**.
2. Edit its Markdown file in GitHub. Use `$...$` for inline LaTeX and `$$...$$` on separate lines for display equations. `\(...\)` and `\[...\]` are also supported. Do not replace math with Unicode approximations or images.
3. Choose **Propose changes**, create a branch/fork as prompted, and open a pull request. Explain the correction and cite its sources.

To add an article, create `wiki/your-topic.md` and add a slug, title, section, and summary to `wiki/index.json`. Sections are Fundamentals, Architectures and Benchmarks; the order of entries in the index is the reading order. Write densely: state the result, give the equation, cite the arXiv identifier. Use `##` headings for sections; they become anchors and the page's table of contents. Slugs use lowercase letters, numbers, and hyphens. Link to another article with `../other-topic/`. The build supplies navigation, edit links, and page history.

KaTeX renders equations into HTML and accessible MathML during the build. Its CSS and fonts are served with the site. Invalid LaTeX fails the build. Raw HTML is escaped; use Markdown for content. Text changes, references, examples, and new topics all follow the same PR process.

## Editorial standards for wiki pages

- **Shape.** Every page opens with a blockquote beginning `**In brief.**` that states the result of the page in three or four sentences, followed by `Notation follows the [conventions page](../notation/).` Sections use `##` headings; they become anchors and the table of contents. The page ends with `## References`.
- **Voice.** State things; do not announce them. No "in this page we will", no "it is worth noting", no lists introduced by a sentence that counts their items. Prefer a derivation or an equation to a description of one.
- **Claims.** Every quantitative statement cites the table, figure or equation it comes from, as an arXiv identifier. Numbers that cannot be traced to a source are not written; if a rounded value is given for scale, say so and point to Ketboard for the digits. Phase-diagram and method attributions name the paper.
- **Notation.** Symbols are those of the [notation page](wiki/notation.md). A page that needs a new symbol defines it where it first appears.
- **References.** One entry per line: authors, *title*, arXiv identifier with year in parentheses, then a short note saying what the reference is for. Journal references are given only for works without an arXiv version.
- **Status.** Each entry in `wiki/index.json` carries `"status": "draft"` or `"reviewed"`. A curator flips a page to reviewed after checking its claims against the sources; the page shows the status next to its section. New and substantially rewritten pages are drafts.

## Add a Ketboard result

1. Open **Ketboard → Submit a result**. Choose the system and the exact instance, type the versioned arXiv identifier, the method, the variant, the architecture class, the energy **exactly as printed** (for example `-0.497634(1)`; the decimal value and the uncertainty are derived from it), whether that printed value is per site or total, the error bar and what it means, the energy variance if the paper prints it, the table or page, and one sentence on why the result is a directly evaluated NQS variational energy. Title and authors can be left empty; they are filled from arXiv on the pull request.

   Every entry needs an error bar. It is read from the parentheses of the printed energy; if the paper prints it as ±, type it in the error-bar field. If the paper states only a bound, for example that statistical errors are below the last printed digit, enter that bound and choose *Upper bound stated in the text*. An energy with no error bar and no stated bound cannot be submitted, and the checks on the pull request reject it. The energy variance is optional: give $\operatorname{Var}(H)$ in the same normalization as the energy (per site if the energy is per site), so that the V-score can be reconstructed.
2. Confirm that the paper reports an original, directly evaluated NQS variational energy and that the instance matches the complete Hamiltonian, lattice, boundaries, couplings and sector.
3. Click **Prepare the record**. For a paper not yet on the board, **Create the file on GitHub** opens the editor with the file filled in. For a paper that already has a record, the page shows the complete file with your row appended: open the existing file on GitHub, replace its content with the JSON shown, and propose the change.
4. Open the pull request and explain the result. A maintainer checks eligibility and transcription before merging.

Results live in `data/results/<unversioned-arxiv-id>.json`. Each row names an architecture class in `method_class` (`rbm`, `feed_forward`, `convolutional`, `autoregressive`, `transformer`, `backflow`, `hybrid`, or `other`); Ketboard filters on it. The record itself pins the exact arXiv version. `energy` and `uncertainty` are decimal strings; `energy_token` preserves the original printed number including parenthesized uncertainty. Unreported uncertainty is `null`, never an invented zero. Leave unknown bibliographic dates empty rather than guessing them.

Human submissions use `extraction_model: "human"`. A source checksum may be null for a human entry; the exact versioned source URL and location are still required. Bot records always include a source checksum. All result rows undergo the same scientific validation.

A benchmark may name a wiki page in `wiki` (a slug from `wiki/index.json`); Ketboard then links the instance to that page, as for the J₁–J₂ square lattice.

**A result for an instance that is not on the board.** In the form, choose *A new instance* and define it from a template: model (Heisenberg, J₁–J₂, transverse-field Ising, Hubbard, t–t′ Hubbard, or a custom Hamiltonian in plain text), lattice, extents, boundary conditions, couplings and sector. The page derives the key, the labels, the Hamiltonian text and LaTeX, and the site count, and shows the complete entry for `data/benchmarks.json` next to the result record. Append the entry to the array in `data/benchmarks.json` and create the result file, in the same pull request; the checks validate both, and the key must follow the scheme of the existing instances (`j1j2-square-10x10-pbc-j2-0p5-sz0`, `hubbard-square-8x8-pbc-u8-n56-sz0`). Keep `name` and `family` as the system name, without size or parameter values, and put size, boundaries, couplings and sector in `instance_label`.

**A result whose instance you cannot define.** Choose *An instance I cannot define* and describe the system completely in words. The record goes to `data/proposals/<arxiv-id>.json` with `benchmark_id: null`; it validates but is never published. A curator adds the definition and moves the row to `data/results/`, exactly as for unmatched results found by the bot.

Only original NQS variational results are accepted. Extrapolated energies, projected estimates, non-NQS methods, and numbers quoted from earlier papers are excluded. See the wiki's benchmark-conventions page for details.

## Local checks

```sh
npm ci --ignore-scripts
python3 -m pip install -r requirements.txt
npm test
python3 -m unittest discover -s tests -v
python3 -m nqsbot.build
```

The PR checks run the renderer, data validation, and tests. A failed check must be fixed before merge. Automated success is not scientific approval. Contributors should never add credentials or downloaded paper files to the repository.
