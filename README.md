# Ketbook

Ketbook is a reference site; **Ketboard** is its reviewed scoreboard for **original NQS variational energies only**. A daily bot discovers new arXiv papers and revisions, extracts numerical results, and opens a pull request. A human approves and merges before any number reaches the published site.

## Current state

The repository includes a working static site, three initial benchmark definitions, an arXiv collector, structured extraction, deterministic validation, a PR writer, and GitHub Actions workflows. **There are no published energy records yet.** No live collection occurs without credentials. The private Sites prototype and the eventual GitHub Pages site are separate deployments; GitHub Pages is the automatic destination after merge.

Initial scope: square J1–J2 (10×10, J2/J1=0.5, PBC), triangular Heisenberg (12×12, PBC), and Hubbard (8×8, U/t=8, 56 electrons, PBC). These are proposed starting instances, editable in `data/benchmarks.json`.

## Run locally

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm ci --ignore-scripts
npm test
python -m unittest discover -s tests -v
python -m nqsbot.build
python -m http.server 8080 --directory dist
```

Requires Node.js 22+ and Python 3.12+. LaTeX is rendered by pinned KaTeX during the build, including accessible MathML; CSS and math fonts are bundled with the site. Section headings get stable anchors and each article carries a table of contents. The site's own typography is DM Sans for display, Source Serif 4 for reading text, and IBM Plex Mono for benchmark keys, energies and identifiers, all with local fallbacks. Wiki edits and manually contributed results are proposed through GitHub PRs. See [CONTRIBUTING.md](CONTRIBUTING.md). The repository must be public for anyone to fork and contribute.

The site works under a subdirectory, including a GitHub project Pages URL. It uses no server database or browser API keys. Fonts have local fallbacks.

## Private preview

While the repository is private, the site is previewed on a Netlify site with a random hostname. The build adds `noindex` to every page, a `robots.txt` that disallows everything, and an `X-Robots-Tag` header, so the preview is not indexed even if the address leaks. It is obscurity, not authentication: share the address only with reviewers.

1. Sign in at netlify.com with GitHub. Under User settings → Applications → Personal access tokens, create a token and store it as the repository secret `NETLIFY_AUTH_TOKEN`.
2. Create a site (Add new site → Deploy manually, drop any folder). Netlify assigns a random name. Copy its Site ID from Site configuration → Site details into the repository secret `NETLIFY_SITE_ID`. Do not connect the repository in Netlify; GitHub Actions does the build.
3. Set the repository variable `PREVIEW_ENABLED=true`. Run the **Preview site** workflow manually on the branch to preview; it also runs on every push to `main`. Edit links on the preview point at the deployed branch.

GitHub Pages stays off (`PUBLISH_PAGES` unset) until the content is curated and the repository is public.

## Activate the daily bot

1. The repository is [gcarleo/ketbook](https://github.com/gcarleo/ketbook), with `main` as its default branch. The bot discovers the default branch; the included validation/publication workflows target `main`.
2. The initial reviewer is `@gcarleo` in `.github/CODEOWNERS`; add other curators as needed. In repository settings, require at least one human approval, dismiss stale approvals on new commits, require code-owner review and the `validate` check, and disallow bypasses. A suggested ruleset is in `.github/ruleset.example.json`. The bot checks for a required approval and stale-review dismissal before writing anything.
3. Configure repository **secrets** `OPENAI_API_KEY` and `NQS_BOT_TOKEN`. Use a dedicated bot identity and a repository-scoped fine-grained token with Contents read/write, Pull requests read/write, and Administration read (for branch-protection inspection). Do not give the bot a ruleset bypass or approval responsibility. An installation token from a GitHub App can replace this token if supplied at runtime.
4. Configure repository **variables** `OPENAI_MODEL` (a model supporting Responses structured outputs) and `ARXIV_CONTACT` (maintainer email). No model or API key is assumed.
5. Choose the intended audience before enabling GitHub Pages: this repository is private, and a Pages site may be publicly accessible. When ready, enable Pages with **GitHub Actions** as its source and set repository variable `PUBLISH_PAGES=true`. Run `Validate` and `Publish reviewed site` after setup. The included private Sites preview is available independently.
6. Set repository variable `BOT_ENABLED=true`. Run `Daily arXiv proposals` manually to validate connectivity, then let its 06:17 UTC daily schedule run. Inspect the first real extractions before broadening discovery.

Use a bot PAT or GitHub App token, not the built-in `GITHUB_TOKEN`, for PR creation: events made using `GITHUB_TOKEN` generally do not start other workflows. The validation workflow must run on the proposed data. No bot code calls a merge, approval, or default-branch update endpoint.

GitHub schedules can be delayed and public-repository schedules can be disabled after 60 inactive days. Configure workflow-failure notifications and an external heartbeat if uninterrupted daily operation is required; a missing run cannot report its own failure. The workflow retains a summary and extraction artifacts for 30 days. It caches completed paper versions and carries an incomplete scan forward until its backlog is processed.

## Extraction and review

- Discovery queries the arXiv API by last update, with a 14-day overlap by default. It paginates, deduplicates cross-lists, serializes requests with at least 3 seconds between them, and uses retry/backoff. A saved scan watermark extends the window after downtime. A manual `lookback_days` input supports backfilling.
- Version-pinned HTML is preferred; text-extracted PDF is the fallback. Raw paper files are processed locally and are not redistributed with the site. Source URLs and SHA-256 checksums are recorded. Image-only or oversized sources fail explicitly; figures are not silently digitized.
- Structured extraction proposes numbers and evidence. It has no tools and receives no GitHub credentials. Paper text is treated as untrusted data. An exact schema is useful for parsing, but does **not** establish scientific correctness.
- Deterministic validation rejects non-NQS, non-variational, cited comparison results, invalid decimals, incompatible units, unknown normalization on matched benchmarks, duplicate rows, and energy tokens absent from the fetched source.
- One PR is opened per paper version. Existing open, merged, or closed PRs suppress repeat proposals; a deliberately closed PR is not reopened. A new arXiv version can produce a new PR. Review must reconcile pending earlier versions; CI rejects version regressions.
- Results matching registered instances go to `data/results/<arxiv-id>.json`. Eligible unmatched systems go to `data/proposals/<arxiv-id>.json` in a **draft PR**. A curator can add the exact definition and move matching rows into results. Proposal files never enter the site payload. Extraction issues also make a PR a draft.
- Source locations and reviewer checkboxes are included in the PR. A source-level review is not an independent reproduction. Statistical uncertainties are displayed with their reported type; absent uncertainties remain unknown.
- Every result row carries a `method_class` (one of `rbm`, `feed_forward`, `convolutional`, `autoregressive`, `transformer`, `backflow`, `hybrid`, `other`) used for filtering on Ketboard; the extraction prompt defines the classes.
- Store printed decimals as strings. Only total-to-per-site normalization is automatic. Pauli/spin conventions, energy offsets, and unit conversions require curator reconciliation.
- Only newly reported ground-state NQS variational results are in scope. Neural backflow and neural fermionic wavefunctions may qualify; using a neural guide in a projection method does not. Extrapolated energies, non-NQS references, and results quoted from earlier papers are excluded.

For local extraction without creating a PR, set environment variables securely and run:

```sh
python -m nqsbot.collect --max-papers 2
```

This writes proposed files and a PR body under ignored `.run/`. Add `--publish-prs` only after configuring the GitHub token and required review gate. Local and PR processing have separate cache keys. To reconsider a closed proposal, resolve it on GitHub deliberately; changing the extraction prompt does not reopen it automatically.

## Layout

- `site/`: Bauhaus-inspired interface; publication includes only reviewed result files. `site/leaderboard.mjs` holds the Ketboard table logic (filtering by architecture class and text, sorting by any column, per-instance summaries) and is unit-tested in `npm test`.
- `wiki/`: community-editable Markdown articles with build-time LaTeX rendering, grouped by section (Fundamentals, Architectures, Benchmarks) in `wiki/index.json`.
- `CONTRIBUTING.md`: wiki and result PR instructions; the site has direct edit links and a result preparation form.
- `data/benchmarks.json`: canonical physical definitions.
- `data/results/`: entries approved by merging their PRs.
- `data/proposals/`: unmatched instances, excluded from the site.
- `nqsbot/`: collection, extraction, validation, PR creation, and static build.
- `prompts/extract.txt`: extraction scope and scientific rules.
- `.github/workflows/`: daily collection, PR checks, and publication after merge.

## Verification limits

The offline tests cover eligibility, normalization, source provenance, duplicates, revision handling, PR idempotency, API response handling, and exclusion of proposals from publication. They do not measure real-paper extraction precision or recall. A model key, GitHub repository, review configuration, and an initial curator audit are needed before calling the daily system operational. Keyword discovery cannot guarantee that every relevant paper is found; expand the query and review missed papers over time.

## References

- [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html)
- [arXiv API terms and rate limits](https://info.arxiv.org/help/api/tou.html)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GitHub workflow triggering and tokens](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [GitHub scheduled workflow limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub repository rules](https://docs.github.com/en/rest/repos/rules)
