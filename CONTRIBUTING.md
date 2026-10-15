# Contributing to Ketbook and Ketboard

Wiki pages and NQS energy results both enter through pull requests. Everyone can propose a contribution once the repository is public. You do not need direct write access: GitHub can create a fork and a branch for your proposal. A maintainer reviews and merges the change.

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

1. Open **Ketboard → Submit a result**. Choose the system and the exact instance, type the versioned arXiv identifier, the method, the variant, the architecture class, the energy **exactly as printed** (for example `-0.497634(1)`; the decimal value and the uncertainty are derived from it), whether that printed value is per site or total, what the parenthesized uncertainty means, the table or page, and one sentence on why the result is a directly evaluated NQS variational energy. Title and authors can be left empty; they are filled from arXiv on the pull request.
2. Confirm that the paper reports an original, directly evaluated NQS variational energy and that the instance matches the complete Hamiltonian, lattice, boundaries, couplings and sector.
3. Click **Prepare the record**. For a paper not yet on the board, **Create the file on GitHub** opens the editor with the file filled in. For a paper that already has a record, the page shows the complete file with your row appended: open the existing file on GitHub, replace its content with the JSON shown, and propose the change.
4. Open the pull request and explain the result. A maintainer checks eligibility and transcription before merging.

Results live in `data/results/<unversioned-arxiv-id>.json`. Each row names an architecture class in `method_class` (`rbm`, `feed_forward`, `convolutional`, `autoregressive`, `transformer`, `backflow`, `hybrid`, or `other`); Ketboard filters on it. The record itself pins the exact arXiv version. `energy` and `uncertainty` are decimal strings; `energy_token` preserves the original printed number including parenthesized uncertainty. Unreported uncertainty is `null`, never an invented zero. Leave unknown bibliographic dates empty rather than guessing them.

Human submissions use `extraction_model: "human"`. A source checksum may be null for a human entry; the exact versioned source URL and location are still required. Bot records always include a source checksum. All result rows undergo the same scientific validation.

A benchmark may name a wiki page in `wiki` (a slug from `wiki/index.json`); Ketboard then links the instance to that page, as for the J₁–J₂ square lattice. For a new benchmark, add its explicit definition to `data/benchmarks.json` in the same PR, and reference its ID in the result file. Keep `name` and `family` as the system name, without size or parameter values. Instances of the same system share that name and appear under one system entry. Put size, boundaries, couplings, and sector in a distinguishing `instance_label`, with `lattice_size` and `boundary_conditions` for their detail rows. Include a symbolic `hamiltonian_latex`, the instance values in `parameters_latex`, and a complete plain-text Hamiltonian convention. The instance ID remains unique and includes the full physical specification. Eligible but unresolved bot discoveries live in `data/proposals/`; those files are never published.

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
