# Contributing to Ketbook and Ketboard

Wiki pages and NQS energy results both enter through pull requests. Everyone can propose a contribution once the repository is public. You do not need direct write access: GitHub can create a fork and a branch for your proposal. A maintainer reviews and merges the change.

## Edit the wiki

1. Open an article on Ketbook and choose **Edit this page**.
2. Edit its Markdown file in GitHub. Use `$...$` for inline LaTeX and `$$...$$` on separate lines for display equations. `\(...\)` and `\[...\]` are also supported. Do not replace math with Unicode approximations or images.
3. Choose **Propose changes**, create a branch/fork as prompted, and open a pull request. Explain the correction and cite its sources.

To add an article, create `wiki/your-topic.md` and add a slug, title, section, and summary to `wiki/index.json`. Slugs use lowercase letters, numbers, and hyphens. Link to another article with `../other-topic/`. The build supplies navigation, edit links, and page history.

KaTeX renders equations into HTML and accessible MathML during the build. Its CSS and fonts are served with the site. Invalid LaTeX fails the build. Raw HTML is escaped; use Markdown for content. Text changes, references, examples, and new topics all follow the same PR process.

## Add a Ketboard result

1. Open **Ketboard → Add a result**. Select the exact benchmark and fill in the paper, method, printed energy, uncertainty, and source location.
2. Confirm that the paper reports an original, directly evaluated NQS variational energy. The instance must match the complete Hamiltonian, lattice, boundaries, couplings, and sector.
3. Prepare the contribution and inspect its JSON. Use **New paper file on GitHub** for a new paper, or **Edit existing paper file** to append to a paper already in the collection. Do not replace existing results accidentally. You can also download the JSON and edit it locally.
4. Open a PR and explain the result. A maintainer checks the scientific eligibility and transcription before merging.

Results live in `data/results/<unversioned-arxiv-id>.json`. The record itself pins the exact arXiv version. `energy` and `uncertainty` are decimal strings; `energy_token` preserves the original printed number including parenthesized uncertainty. Unreported uncertainty is `null`, never an invented zero. Leave unknown bibliographic dates empty rather than guessing them.

Human submissions use `extraction_model: "human"`. A source checksum may be null for a human entry; the exact versioned source URL and location are still required. Bot records always include a source checksum. All result rows undergo the same scientific validation.

For a new benchmark, add its explicit definition to `data/benchmarks.json` in the same PR, and reference its ID in the result file. Keep `name` and `family` as the system name, without size or parameter values. Instances of the same system share that name and appear under one system entry. Put size, boundaries, couplings, and sector in a distinguishing `instance_label`, with `lattice_size` and `boundary_conditions` for their detail rows. Include a symbolic `hamiltonian_latex`, the instance values in `parameters_latex`, and a complete plain-text Hamiltonian convention. The instance ID remains unique and includes the full physical specification. Eligible but unresolved bot discoveries live in `data/proposals/`; those files are never published.

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
